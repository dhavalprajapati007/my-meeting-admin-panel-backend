exports.transform = (data) => {
	return {
		_id: data._id,
        user1_details : Object.keys(data.user1_details).length !== 0 ? data.user1_details : {},
        user2_details :  Object.keys(data.user2_details).length !== 0 ? data.user2_details : {},
        count : data.count ? data.count : 0,
        message : data.messages?.length > 0 ? `${data.messages?.slice(0,20)}....` : "",
        createdAt : data.createdAt,
        upatedAt : data.updatedAt
	};
};

exports.transformListCollection = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((val) => {
            data.push(this.transform(val));
        });
    }
    arrayData = data;
    return arrayData;
};