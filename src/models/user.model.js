const { boolean } = require('joi');
const mongoose = require('mongoose');

const UsersSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        require : true
    },
    avatar: {
        type: String,
    },
    occupation: {
        type: String
    },
    dateOfBirth: {
        type: Date
    },
    role: {
        type: Number,
        default: 1,
        enum: [1, 2, 3, 4], //1= User 2= Vendor 3= Admin 4= Super Admin
    },
    addressCordinater: {
        lat: {
            type:String
        },
        lang: {
            type:String
        }
    },
    deviceId: {
        type: String
    },
    stripeCustomerId: {
        type: String
    },
    lastLogin: {
        type: String
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3]	//1 = Active 2 = InActive 3 = Deleted
    },
    resetToken: {
        type: String,
    }, 
    vendorDetails: {
        panNumber: {
            type: String
        },
        idProofDetails: {
            panCard : {
                type:String
            },
			aadharFront : {
                type:String
            },
			aadharBack : {
                type:String
            }
        },
        providerType : {
            type : Number,
            enum : [0, 1, 2, 3] //0=null/undefined, 1='place', 2='service', 3='place & service both'
        },
        address : {
			line1 : {
                type:String
            },
			line2 : {
                type:String
            },
			city : {
                type:String
            },
			state : {
                type:String
            },
			pincode : {
                type:Number
            }
		},
        stripeId : {
            type : String
        },
        isVerified : {
            type : Boolean
        },
        balance : {
            totalRevenue : {
                type:Number
            },
            totalPayout : {
                type:Number
            },
            availableBalance : {
                type:Number
            },
            withdrawableBalance : {
                type:Number
            }
        },
        paymentMethods : [
            {
                type : {
                    type:String, //it can be UPI or Bank
                    enum :[ "bank", "upi"]
                },
                upiId : {
                    type:String
                },
                bankName : {
                    type:String
                },
                holderName : {
                    type:String
                },
                acNumber : {
                    type:String
                },
                ifscCode : {
                    type:String
                },
                accountType : {
                    type:String
                }
            }
        ]
    },
    registrationStep : {
        type : Number,
        enum : [1, 2, 3, 4],
    },
}, { collection: 'users', timestamps: true });

module.exports = mongoose.model('users', UsersSchema);