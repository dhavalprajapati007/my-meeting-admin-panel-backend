const ChatModel = require("../../models/chat.model");

var ObjectId = require("mongodb").ObjectID;

exports.findExistingChat = async (data) => {
	try{
		let pipeline = [];

		// adding query into the pipeline array
		pipeline.push({
			$match: {
                $expr: {
                    $and: [
                        { 
                            $or : [
                                { $eq: [ "$user1_id", data.user1_id ] },
                                { $eq: [ "$user2_id", data.user1_id ] },
                            ]
                        },
                        { 
                            $or : [
                                { $eq: [ "$user1_id", data.user2_id ] },
                                { $eq: [ "$user2_id", data.user2_id ] },
                            ]
                        }
                    ]
                }
			},
		});

		const result = await ChatModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error In FINDEXISTINGCHAT ', error);
		return false;
	}
}

exports.getChats = async (id) => {
	try{
		let pipeline = [];

		// adding query into the pipeline array
		pipeline.push({
			$match: {
            	$expr: {    
                	$or : [
                        { $eq: [ "$user1_id", id ] },
                        { $eq: [ "$user2_id", id ] },
                    ]
                }
			},
		});

		pipeline.push({
			$lookup : {
				from: 'chat', 
				let: {
					'id': id
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$or : [
									{ $eq: [ "$user1_id", '$$id' ] },
									{ $eq: [ "$user2_id", '$$id' ] },
								]
							}
						}
					},
					{
						$unwind: {
							path: '$messages', 
							preserveNullAndEmptyArrays: true
						}
				  	}, {
						$match: {
							$expr: {
								$and: [
									{
										$ne: [
											'$messages.authorId', '$$id'
										]
									}, {
										$eq: [
											'$messages.isRead', false
										]
									}
								]
							}
						}
				  	}, {
						$count: 'count'
					}
				],
				as: 'count'
			}
		});

		pipeline.push({
			$addFields: {
				count: {
					$sum : '$count.count'
				}
			}
		})

		pipeline.push({
			$lookup: {
				from: 'users', 
				let: {
					'id': '$user2_id'
				}, 
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [
									'$_id', '$$id'
								]
							}
						}
					}, {
						$project: {
							'firstName': 1, 
							'lastName': 1,
							'avatar' : 1
						}
					}
				], 
				as: 'user2_details'
			}
		})

		pipeline.push({
			$unwind: {
				path: '$user2_details', 
				preserveNullAndEmptyArrays: true
			}
		})

		pipeline.push({
			$lookup: {
				from: 'users', 
				let: {
					'id': '$user1_id'
				}, 
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [
									'$_id', '$$id'
								]
							}
						}
					}, {
						$project: {
							'firstName': 1, 
							'lastName': 1,
							'avatar' : 1
						}
					}
				], 
				as: 'user1_details'
			}
		})

		pipeline.push({
			$unwind: {
				path: '$user1_details', 
				preserveNullAndEmptyArrays: true
			}
		})

		pipeline.push({
			$project: {
				'messages': { $slice: [ '$messages', -1] }, 
				'user1_details': 1, 
				'user2_details': 1, 
				'count': 1, 
				'createdAt': 1, 
				'updatedAt': 1
			}
		})

		pipeline.push({
			$unwind: {
				path: '$messages', 
				preserveNullAndEmptyArrays: true
			}
		})

		pipeline.push({
			$addFields: {
				'messages': '$messages.messageContent'
			}
		})

		const result = await ChatModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error In FINDEXISTINGCHAT ', error);
		return false;
	}
}