const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
	DELETED_STATUS,
} = require("../../../config/key");
const ServiceModel = require("../../models/service.model");

var ObjectId = require("mongodb").ObjectID;

//Service list get
exports.getService = async (data) => {
	try {
		let pipeline = [];
		
        //adding query into the pipeline array
		pipeline.push({
			$match: {
				_id: ObjectId(data.id),
				status: ACTIVE_STATUS,
			},
		}, {
			$lookup: {
				from: "services",
				localField: "_id",
				foreignField: "parent",
				as: "childs"
			}
		});

		const result = await ServiceModel.aggregate(pipeline);
		return result;
	} catch (e) {
		console.log(e);
		return false;
	}
};


// All Service list get
exports.getServices = async () => {
	try{
		let pipeline = [];
		pipeline.push({
			$match: {
				parent: null,
				status: ACTIVE_STATUS
			}
		})

		pipeline.push({
			$lookup : {
				from : 'vendorService', 
				let : {
				  id : '$_id'
				}, 
				pipeline : [
				  {
					$match : {
					  $expr : {
						$eq : [
						  "$serviceId" , '$$id'
						]
					  }
					}
				  }, {
					$count : 'count'
				  }
				], 
				as : 'totalServiceProviders'
			}
		})

		pipeline.push({
			$addFields : {
				'totalServiceProviders': {
				  $sum : '$totalServiceProviders.count'
				}
			}
		})
		
		pipeline.push({
			$lookup : {
				from : 'services', 
				let : {
				  id : '$_id'
				}, 
				pipeline : [
				  {
					$match : {
					  $expr : {
						$eq : [
						  "$parent", '$$id'
						]
					  }
					}
				  }, {
					$lookup : {
					  from : 'vendorService', 
					  let : {
						id: '$_id'
					  }, 
					  pipeline : [
						{
						  $match: {
							$expr: {
							  $eq: [
								"$serviceId", '$$id'
							  ]
							}
						  }
						}, {
						  $count : 'totalSp'
						}
					  ], 
					  as: 'totalServiceProviders'
					}
				  }, {
					$unwind : {
					  path : '$totalProvider', 
					  preserveNullAndEmptyArrays : true
					}
				  }, {
					$addFields : {
					  'totalServiceProviders': {
						$sum : '$totalServiceProviders.totalSp'
					  }
					}
				  }
				], 
				as : 'childs'
			}
		})

		const result = await ServiceModel.aggregate(pipeline);
		return result
	}catch(error){
		console.log('error ', error);
		return false;
	}
}