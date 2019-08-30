`use strict`

const {
    FilesReader,
    SkillsWriter
} = require('./skills-kit-2.0');

//GCP
const Vision = require('@google-cloud/vision');
const vision = new Vision.ImageAnnotatorClient();

//AWS
const AWS = require('aws-sdk');

//UTILS
const Axios = require('axios');
const _ = require('underscore');
const request = require('request');
const async = require('async');
const sharp = require('sharp');
const crypto = require('crypto');

//GCP FUNCTION
exports.detectCombineHttp = async (req, res) => {
    console.log('#DETECT STARTED');

    const filesReader = new FilesReader(JSON.stringify(req.body));
    const fileContext = filesReader.getFileContext();

    var fileName = fileContext.fileName;
    var fileDownloadURL = fileContext.fileDownloadURL;
    var fileSize = fileContext.fileSize;

    console.log('#DETECT 2', JSON.stringify(fileContext));

    const skillsWriter = new SkillsWriter(fileContext);

    const MAX_LABELS = 100;
    const MIN_CONFIDENCE = 70;

    AWS.config.update({
        accessKeyId: '',
        secretAccessKey: '',
        region: ''
    });

    const s3 = new AWS.S3();
    const rekognition = new AWS.Rekognition();

    var _labels = [];

    var axiosResponse = null;

    var seriesA = [];
    seriesA.push((callback) => {
        console.time(`^^^^^ axios`);

        //Get uploaded file content from box.com
        Axios
            .get(fileDownloadURL, {
                crossDomain: true,
                responseType: 'arraybuffer'
            })
            .then((response) => {
                axiosResponse = response.data;
                console.timeEnd(`^^^^^ axios`);
                callback(null);
            })
            .catch((error) => {
                console.timeEnd(`^^^^^ axios`);
                callback(error);
            });
    });

    var parellelA = [];
    parellelA.push((callback) => {
        const labelParams = {
            Image: {
                Bytes: new Buffer.from(axiosResponse, 'binary')
            },
            MaxLabels: MAX_LABELS,
            MinConfidence: MIN_CONFIDENCE
        };

        //AWS LABEL DETECTION
        console.time(`^^^^^ aws detect labels`);
        rekognition.detectLabels(labelParams, (err, data) => { //Execute call to AWS Rekognition service using paremeters and image data set in labelParams
            console.timeEnd(`^^^^^ aws detect labels`);
            if (err) { //There was an error processing the request
                console.log('Error on detectLabels call: ');
                console.log(err, err.stack);
            } else { //No error received, create entries array to hold the labels that are returned from Rekognition
                if (data.Labels.length > 0) {
                    data.Labels.map((label) => {
                        _labels.push({
                            type: 'text',
                            text: label.Name,
                            score: label.Confidence
                        });
                    });
                }
            }
            callback(null);
        });
    });

    parellelA.push((callback) => {
        const process = async () => {
            console.time(`^^^^^ google detect labels`);
            const [result] = await vision.annotateImage({
                image: {
                    content: new Buffer.from(axiosResponse, 'binary')
                },
                features: [{
                    type: "LABEL_DETECTION",
                    maxResults: MAX_LABELS // change this result
                }]
            });
            console.timeEnd(`^^^^^ google detect labels`);

            const labels = result.labelAnnotations;

            labels.forEach(label => _labels.push({
                type: 'text',
                text: label.description,
                score: label.score * 100
            }));

            callback(null);
        }

        process();
    });

    seriesA.push((callback) => {
        async.parallel(parellelA, callback);
    });

    function put_from_url(url, bucket, key, callback) {
        request({
            url: url,
            encoding: null
        }, function (err, res, body) {
            if (err) {
                callback(err);
            } else {
                s3.putObject({
                    Bucket: bucket,
                    Key: key,
                    Body: body
                }, callback);
            }
        });
    }

    function resize_file(bucket, key, callback) {
        s3.getObject({ Bucket: bucket, Key: key }, function(err, image) {
            sharp(image.Body)
                .resize(640)
                .toFormat('png')
                .toBuffer()
                .then(data => {
                    s3.putObject({
                        Bucket: bucket,
                        Key: `${key.replace(/.[^.]+$/, '')}-resized.png`,
                        Body: data
                    }, function(err) {
                        callback(err, `${key.replace(/.[^.]+$/, '')}-resized.png`);
                    });
                })
                .catch(err =>{
                    callback(err);
                });
        });
    }

    var seriesB = [];

    seriesB.push((callback) => {
        console.time(`^^^^^ upload to s3`);
        put_from_url(fileDownloadURL, 'box-app-image2', fileName, function (err) {
            if (fileSize > 1024*1024*1) { // >=1M
                resize_file('box-app-image2', fileName, function (err, key) {
                    console.timeEnd(`^^^^^ upload to s3`);
                    if (!err) fileName = key;
                    callback(err);
                });
            } else {
                console.timeEnd(`^^^^^ upload to s3`);
                callback(err);
            }
        });
    });

    var faces = [];

    seriesB.push((callback) => {
        console.time(`^^^^^ fetch faces from s3`);
        s3.listObjectsV2({Bucket: 'box-app-faces'}, function (err, data) {
            if (!err) {
                data.Contents.forEach(person => {
                    faces.push({
                        s3: person.Key,
                        name: person.Key.replace(/\.[^/.]+$/, "")
                    });
                });
            }
            console.timeEnd(`^^^^^ fetch faces from s3`);
            console.log(`${JSON.stringify(faces)}`);
            callback(err);
        });
    });

    seriesB.push((callback) => {
        var parellelB = [];

        console.log(`faces length: ${faces.length}`);

        if (faces.length) {
            faces.forEach(face => {
                parellelB.push((callback) => {
                    console.time(`^^^^^ compare face ${face.name}`);
                    rekognition.compareFaces({
                        SourceImage: {
                            S3Object: {
                                Bucket: 'box-app-faces', Name: face.s3
                            }
                        },
                        TargetImage: {
                            S3Object: {
                                Bucket: 'box-app-image2', Name: fileName
                            }
                        }
                    }, (err, data) => {                    
                        console.timeEnd(`^^^^^ compare face ${face.name}`);
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                            console.log(`Face Compare Details: ${JSON.stringify({
                                SourceImage: {
                                    S3Object: {
                                        Bucket: 'box-app-faces', Name: face.s3
                                    }
                                },
                                TargetImage: {
                                    S3Object: {
                                        Bucket: 'box-app-image2', Name: fileName
                                    }
                                }
                            })}`);
                        } else {
                            if (data.FaceMatches.length) {
                                _labels.push({
                                    type: 'text',
                                    text: face.name,
                                    score: data.FaceMatches[0].Similarity
                                });
                            }
                        }
                        callback(null);
                    });
                });
            });
            async.parallel(parellelB, callback);
        } else {
            callback(null);
        }
    });

    var parallel = [];
    
    parallel.push((callback) => {
        async.series(seriesB, callback);
    });

    parallel.push((callback) => {
        async.series(seriesA, callback);
    });

    async.parallel(parallel, function(err) {
        if (!err) {
            //SORT AND ADD SKILLS
            _labels = _.sortBy(_labels, function (label) {
                return 100 - label.score;
            });

            console.log('#DETECT 3', JSON.stringify(_labels));

            var entries = [];
            _labels.forEach(label => entries.push({
                type: 'text',
                text: label.text
            }));

            //Create Keyword Cards
            const keywordCards = skillsWriter.createTopicsCard(entries);
            //If we have any labels that were returned from Rekognition, save them back to Box as cards
            if (keywordCards.entries.length > 0) {
                skillsWriter.saveDataCards([keywordCards], (error) => {
                    if (error) {
                        console.error(JSON.stringify(error));
                    }
                });
            }
        }

        res.send(`DETECT FUNCTION SUCCEEDED`);
    });
};