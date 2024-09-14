const OfficeModel = require("../../models/office.model");
const AmenitiesSchema = require("../../models/amenitie.model");
var ObjectId = require("mongodb").ObjectID;
const { facetHelper } = require("../../helpers/pagination.helper");

// get avrage point of locations
var get_avarage_location = (array) => {
    try {
        return new Promise((resolve, reject) => {
            if (Array.isArray(array) && array.length >= 2) {
                // array size is >= 2 so it's "in-between"
                var totalLat = 0; var totalLang = 0;
                array.map((item, index) => {
                    totalLat = totalLat + item.lat;
                    totalLang = totalLang + item.lang;
                    if (index == array.length - 1) {
                        let lat = totalLat / array.length;
                        let lang = totalLang / array.length;
                        resolve({ lat: Number(lat), lang: Number(lang) });
                    }
                })
            } else if (Array.isArray(array) && array.length == 1) {
                // array size is 1 then it is "nearby"
                resolve({ lat: Number(array[0].lat), lang: Number(array[0].lang) });
            } else {
                throw new Error('Location Array length should be minimum 1');
            }
        });
    } catch (error) {
        throw new Error(error);
    }
};


//Office list get by geo location
exports.getOfficesByGeoLocations = async (data) => {
    try {
        /**
         * radius = in meters
         * cordinates = [{lat,lang}] 
         * type = schedule /express
         * 
         * category = personal /official /both
         * price
         * amenitieIds
         * capacity
         */

        let pipeline = [];

        // check for nearby or in-between
        let location = await get_avarage_location(data.cordinates);

        pipeline.push({
            $geoNear: {
                near: { type: "Point", coordinates: [location.lang, location.lat] },
                distanceField: "dist.calculated",
                maxDistance: Number(data.radius), // in meters ( 1000 meters = 1KM )
                includeLocs: "dist.addressCordinater",
                spherical: true
            }
        });

        pipeline.push({
            $match: {
                isKycCompleted: true
            }
        })

        if (data.type != null) {
            pipeline.push({
                $match: {
                    $expr: {
                        $in: ["$officeType", [data.type,'both']]
                    }
                }
            })
        }

        let preferenceArray = [1, 2, 3];
        if (data.prefrences !== 'both') {
            let value = data.prefrences == 'personal' ? 2 : 1;
            preferenceArray = preferenceArray.filter(item => item !== value);
        }
        
        pipeline.push({
            $lookup: {
                from: "officeCabins",
                let: { id: "$_id" },
                pipeline: [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and: [
                                    {
                                        $eq: ["$officeId", "$$id"]
                                    },
                                    {
                                        $in: ["$prefrences", preferenceArray]
                                    },
                                    {
                                        $lte: ["$price", data.price]
                                    },
                                    {
                                        $gte: ["$capacity", data.capacity]
                                    },
                                    {
                                        $eq: ["$isAvailable", true]
                                    }
                                ]
                            }
                        }
                    },
                ],
                as: "cabins"
            }
        });



        // FIXME: if no amenitieIds provided then empty offices will be still there.
        let offices = await OfficeModel.aggregate(pipeline);
        return data.amenitieIds && data.amenitieIds.length > 0 ?  await removeCabin(offices, data.amenitieIds) : await removeCabin(offices, null)
    } catch (e) {
        console.log(e);
        return false;
    }
};

//remove cabins whose amenitie id not match
async function removeCabin(offices, inputArray){
    for (let i = 0; i < offices.length; i++) {
        if(offices[i].cabins.length <= 0){
            delete offices[i];
        }else{
            if(inputArray !== null && inputArray.length > 0){s 
                for (let j = 0; j < offices[i].cabins.length; j++) {
                    let isAmenitieMatch =  await findCommonElement(inputArray, offices[i].cabins[j].amenitieIds);
                    if(!isAmenitieMatch){
                        delete offices[i].cabins[j]
                    }
                    if(offices[i].cabins.length > 0 ){ offices[i].cabins = offices[i].cabins.filter(function (el) { return el != null; }) }
                }
                if(offices[i].cabins.length <= 0) { delete offices[i] }
            }
        } 
    }

    if(offices && offices.length > 0) offices = offices.filter(function (el) { return el != null; });
    return offices;
}

async function findCommonElement(array1, array2) {
    for(let i = 0; i < array1.length; i++) {
        for(let j = 0; j < array2.length; j++) {
            if(array1[i].toString() == array2[j].toString()) {
                return true;
            }
        }
    }
    return false;
}

exports.getOfficeDetails = async (data) => {
    try{
        let pipeline = [];

        pipeline.push({
            $match: {
                $expr : {
                    $eq : ["$_id", ObjectId(data.id)]
                }
            }
        });

        pipeline.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "vendor"
            }
        })

        pipeline.push({
            $lookup: {
                from: "officeCabins",
                localField: "_id",
                foreignField: "officeId",
                as: "cabins"
            }
        });
        
        pipeline.push({
            $unwind: {
                path: '$cabins',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({
            $lookup: {
                from: "amenities",
                localField: "cabins.amenitieIds",
                foreignField: "_id",
                as: "cabins.amenities"
            }
        });

        let offices = await OfficeModel.aggregate(pipeline);
        let officeData = await fetchCabins(offices);
        return officeData;
    }catch(error){
        console.log(error);
        return false;
    }
}

async function fetchCabins(offices){
    try{
        if(!offices || offices.length <= 0) return false;

        let cabins = [];
        for (let i = 0; i < offices.length; i++) {
            cabins.push(offices[i].cabins);
        }
        offices[0].cabins = cabins;
        return offices[0];
    }catch(error){
        throw error;
    }
}

exports.getOfficesByVendor = async (data) => {
    try{
        let pipeline = [];

        pipeline.push({
            $match: {
                $expr : {
                    $eq : ["$userId", ObjectId(data.userId)]
                }
            }
        });

        pipeline.push({
            $lookup: {
                from: "officeCabins",
                localField: "_id",
                foreignField: "officeId",
                as: "cabins"
            }
        });

        pipeline.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "vendor"
            }
        })

        let offices = await OfficeModel.aggregate(pipeline);
        return offices;
    }catch(error){
        console.log(error);
        return false;
    }
}

exports.getOfficesAll = async (data) => {
    try{
        let pipeline = [];

        pipeline.push({
            $match: {
                $expr : {
                    $eq : ["$isKycCompleted", data.verified]
                }
            }
        })

        pipeline.push({
            $lookup: {
                from: "officeCabins",
                localField: "_id",
                foreignField: "officeId",
                as: "cabins"
            }
        });

        pipeline.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "vendor"
            }
        })

        pipeline.push({ $sort: { createdAt: -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
        let offices = await OfficeModel.aggregate(pipeline);
        return offices;
    }catch(error){
        console.log(error);
        return false;
    }
}

exports.getOfficeLocations = async () => {
    try{
        let pipeline = [];
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "vendor"
            }
        });
        
        pipeline.push({
            $project: {
                'name' : 1,
                'addressCordinater.coordinates' : 1,
                'address' : 1,
                'vendor.firstName' : 1,
                'vendor.lastName' : 1
            }
        });
        let offices = await OfficeModel.aggregate(pipeline);
        return offices;
    }catch(error){
        return false;
    }
}