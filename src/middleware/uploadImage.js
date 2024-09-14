const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const multerS3 = require('multer-s3');
const {
    APP_URL
} = require("../../config/key");

const aws = require('aws-sdk');

const s3 = new aws.S3();

const userDocumentImagesStorage = multerS3({
    s3: s3,
    bucket: "mymeeting-new/user_documents",
    key: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})

exports.storeUserDocumentsImage = multer({
    storage: userDocumentImagesStorage,
    limits: { fileSize: 1024 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|webp)$/)) {
            return cb(new Error("Please upload an image!"), false);
        }
        cb(undefined, true);
    },
}).fields([{ name: "panCard" }, { name: "aadharFront" }, { name: "aadharBack" }, { name: "avatar" }]);


exports.userDocumentsImageURL = (filename) => {
    return `${APP_URL}/images/user_documents/${filename}`;
};


// Upload Cabin Images 
const CabinImageStorage = multerS3({
    s3: s3,
    bucket: "mymeeting-new/cabin_images",
    key: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})

exports.storeCabinImages = multer({
    storage: CabinImageStorage,
    limits: {
        fileSize: 1024 * 1024 * 1024
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|webp)$/)) {
            return cb(new Error("Please upload an image!"), false);
        }
        cb(undefined, true);
    }
}).array("images", 15)

exports.cabinImageURL = (filename) => {
    rturn`${APP_URL}/images/cabin_images/${filename}`;
}


// Upload Amenities Images
const AmenitiesImageStorage = multerS3({
    s3: s3,
    bucket: "mymeeting-new/amenities",
    key: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})

exports.storeAmenitieImage = multer({
    storage: AmenitiesImageStorage,
    limits: {
        fileSize: 1024 * 1024 * 1024
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|webp)$/)) {
            return cb(new Error("Please upload an image!"), false);
        }
        cb(undefined, true);
    }
}).single("image")

exports.amenitieImageURL = (filename) => {
    rturn`${APP_URL}/images/amenities/${filename}`;
}



const ImagesStorage = multerS3({
    s3: s3,
    bucket: "mymeeting-new",
    key: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})
exports.storeSingleImage = multer({
    storage: ImagesStorage,
    limits: {
        fileSize: 1024 * 1024 * 1024,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|webp)$/)) {
            return cb(new Error("Please upload an image!"), false);
        }
        cb(undefined, true);
    },
}).single("image");

exports.imageURL = (filename) => {
    return `${APP_URL}/images/${filename}`;
};


exports.storeMultipleImage = multer({
    storage: ImagesStorage,
    limits: {
        fileSize: 1024 * 1024 * 1024,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|webp)$/)) {
            return cb(new Error("Please upload an image!"), false);
        }
        cb(undefined, true);
    },
}).array('images', 15);

const CertificateStorage = multerS3({
    s3: s3,
    bucket: "mymeeting-new/certificate",
    key: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})

exports.storeCertificateImage = multer({
    storage: CertificateStorage,
    limits: {
        fileSize: 1024 * 1024 * 1024,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|webp)$/)) {
            return cb(new Error("Please upload an image!"), false);
        }
        cb(undefined, true);
    },
}).array("certificate", 15);

exports.certificateURL = (filename) => {
    return `${APP_URL}/certficate/${filename}`;
};
