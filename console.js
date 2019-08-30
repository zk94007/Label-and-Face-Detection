const AWS = require('aws-sdk');
var request = require('request');
const Jimp = require('jimp');

AWS.config.update({
    accessKeyId: '',
    secretAccessKey: '',
    region: ''
});

var s3 = new AWS.S3();

// function put_from_url(url, bucket, key, callback) {
//     console.log('####### 1');
//     request({
//         url: url,
//         encoding: null
//     }, function (err, res, body) {
//         if (err)
//             return callback(err, res);
//         s3.putObject({
//             Bucket: bucket,
//             Key: key,
//             ContentType: res.headers['content-type'],
//             ContentLength: res.headers['content-length'],
//             Body: body // buffer
//         }, callback);
//     });
// }

// const response = (err, data) => {
//     if (err) {
//         console.log(`Error: ${err}`);
//     } else {
//         console.log(`Succes: ${JSON.stringify(data)}`);
//     }
// };

const rekognition = new AWS.Rekognition();
// const collection = rekognition.createCollection({
//     CollectionId: 'box-app-faces'
// }, (err, data) => {
//     if (err) {
//         console.log(`Error: ${err}`);
//     } else {
//         console.log(`Succes: ${JSON.stringify(data)}`);
//     }
// });

// var faces = {
//     "af57ce2f-79ee-4428-b7f0-f78338ae6a30": 'Dmytro Kiselov',
//     "6f62d9bc-32be-4808-b906-a69fb4777fe": 'Skipp',
//     "2319bdf7-45a9-448a-a490-7cec646e82cd": 'Victoria'
// };

// s3.listObjectsV2({Bucket: 'box-app-faces'}, function (err, data) {
//     if (!err) {
//         data.Contents.forEach(person => {
//             console.log(person.Key.replace(/\.[^/.]+$/, ""));
//         });
//     }
// });

// rekognition.indexFaces({
//     CollectionId: 'box-app-faces',
//     Image: {
//         S3Object: {
//             Bucket: 'box-app-faces', Name: 'skipp 3.jpg'
//         }
//     }
// }, (err, data) => {
//     if (err) {
//         console.log(`Error: ${err}`);
//     } else {
//         console.log(`Succes: ${JSON.stringify(data)}`);
//     }
// });

// rekognition.searchFacesByImage({
//     CollectionId: 'box-app-faces',
//     Image: {
//         S3Object: {
//             Bucket: 'box-app-faces', Name: 'skipp 2.jpg'
//         }
//     }
// }, (err, data) => {
//     if (!err) {
//         // console.log(data);
//         // console.log(data.FaceMatches[0].Face);
//         data.FaceMatches.forEach((face) => {
//             console.log(face.Face.FaceId);
//         });
//     }
// });


// rekognition.compareFaces({  
//     SourceImage: {
//         S3Object: {
//             Bucket: 'box-app-faces', Name: 'Alexey Kuznetsov.png'
//         }
//     },
//     TargetImage: {
//         S3Object: {
//             Bucket: 'box-app-image', Name: 'dstraub.png'
//         }
//     }
// }, (err, data) => {
rekognition.compareFaces({"SourceImage":{"S3Object":{"Bucket":"box-app-faces","Name":"Ignacio Dibartolo.png"}},"TargetImage":{"S3Object":{"Bucket":"box-app-image2","Name":"00DSCF8875-size.jpg"}}}, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    else {
        console.log(data);
        // console.log(data.FaceMatches[0].Face);
        data.FaceMatches.forEach((face) => {
            console.log(face.Face);
        });
    }
});

// const sharp = require('sharp');
// const md5Base64 = require('md5-base64');

// var crypto = require('crypto');

// var url = 'https://api.box.com/2.0/files/496336340129/content?access_token=1!UhIjWYAA3A1nSAjOf3-2uyT8rx9Si0ZemMpJFVaMwfAMumG0FLupFooNwuAMLOSezMg-A8jDEfqtQtJp_rj-pzxZ3BFZK_M_jyuLbE4hJ4ZwN--WSJMkso7fxvjdG3eBB8jvOI4eOT0CaXUIVKvahf-mXh856POjqwWvdQKkKIC-wgj3DLLfgZzniUUe1lcFymbKHUd8hM-u0_Ndfm-6MEAFGrdPrqyOUNhEyRxqUCh6FKHXi2deVt5Q9jxCxWhom2nO5Eo2sr_OBmeyL8e8B8kWIulf--zO9WpDB1NnLvzboG8KwIvLlpdkciSMhO1YYCpxqa2_dqJTvTQmHMB7enk9uI3V1rQf2Hw_ZqTUTCVcpHJA-950xD7hTHxA7NkP1WDn-fw96jcOTGloQ7EJbMTlz8l14jPirkqenLAoAiS4R54.';

// // url = 'https://i.imgur.com/V45GehK.jpg';

// // url = 'https://box-app-image2.s3-us-west-2.amazonaws.com/dstraub.png';

// function getMD5HashFromFile(file){
//     var hash = crypto.createHash("md5")
//         .update(file)
//         .digest("base64");
//     return hash;
// }

// var Key = 'key.jpg';

// s3.getObject({ Bucket: 'box-app-image2', Key }, function(err, image) {
//     sharp(image.Body)
//         .resize(640)
//         .toFormat('jpeg')
//         .toBuffer()
//         .then(data => {
//             console.log(data.length);
//             s3.putObject({
//                 Bucket: 'box-app-image2',
//                 Key: `${Key.replace(/.[^.]+$/, '')}-size.jpg`,
//                 Body: data
//             }, function(err) {
//                 console.log(err);
//             });
//         })
//         .catch(err =>{
//             console.log(err);
//         });
// });

// request({
//     url: url,
//     encoding: null
// }, function (err, res, body) {
//     if (err) {
//         callback(err);
//     } else {
//         sharp(body)
//             // .resize(640)
//             // .toFormat('jpg')
//             // .toBuffer()
//             .toFile('key.jpg')
//             .then(() => {
//                 sharp('key.jpg')
//                     .toBuffer()
//                     .then(data => {
//                         s3.putObject({
//                             Bucket: 'box-app-image2',
//                             Key: 'key.jpg',
//                             ContentType: res.headers['content-type'],
//                             ContentLength: res.headers['content-length'],
//                             Body: data
//                         }, function(err) {
//                             console.log(err);
//                         });
//                     });
                
//             });
//     }
// });

// Jimp.read(url)
//     .then(image => {
//         console.log(image);
//         image.resize(640, Jimp.AUTO);
//         // image.getBuffer(Jimp.AUTO, function(buffer) {
//         //     s3.putObject({
//         //         Bucket: 'box-app-image2',
//         //         Key: 'key.jpeg',
//         //         ContentType: res.headers['content-type'],
//         //         ContentLength: res.headers['content-length'],
//         //         Body: buffer
//         //     }, function() {
//         //         console.log('success');
//         //     });
//         // });
//     })
//     .catch(err => {
//         console.log(err);
//     });

// rekognition.detectFaces({
//     Image: {
//         S3Object: {
//             Bucket: 'box-app-faces', Name: 'skippp.jpg'
//         }
//     }
// }, (err, data) => {
//     if (!err) {
//         // console.log(data);
//         console.log(data);
//     }
// });


// rekognition.listFaces({
//     CollectionId: 'box-app-faces'
// }, (err, data) => {
//     if (!err) {
//         // console.log(data);
//         console.log(data);
//     }
// });

// const process = async () => {
//     // const collection = await rekognition.createCollection('box-app-faces');
//     // console.log(collection);
//     const faces = await rekognition.listFaces('box-app-faces');
//     console.log(faces.response.data);
//     // const imageFaces = await rekognition.detectFaces({
//     //     Image: {
//     //         S3Object: {
//     //             Bucket: 'box-app-faces', Name: 'alan1.jpg'
//     //         }
//     //     },
//     //     Attributes: [
//     //         'ALL',
//     //     ]
//     // });
//     console.log(imageFaces.response.data);
// }
// process();



// put_from_url('https://www.pip.global/hubfs/PIP%20May%202018/Leadership%20New/ignacio-dibartolo.png', 'box-app-faces', 'ignacio-dibartolo.png', function (err) {
//     console.log('####### 3');
//     if (err) {
//         console.log(err);
//     } else {
//         const rekognition = new AWS.Rekognition();
//         const process = async () => {
//             // const collection = await rekognition.createCollection('box-app-faces');
//             // console.log(collection);
//             // const faces = await rekognition.listFaces('box-app-faces');
//             // console.log(faces);
//             // const imageFaces = await rekognition.detectFaces({Bucket: 'box-app-faces', Name: 'alan1.jpg'});
//             // console.log(imageFaces);
//         }
//         process();
//     }
// });