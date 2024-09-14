exports.transformOfficeDetail = (data) => {
	return {
		_id: data._id,
		name: data?.name ? data.name : "",
        userId: data?.userId ? data.userId : "",
        address: data?.address ? data.address : "",
		addressCordinater: data?.addressCordinater ? data.addressCordinater : {},
		representativeDetails: data?.representativeDetails ? data.representativeDetails : {},
        officeType: data?.officeType ? data.officeType : 'both',
        isKycCompleted : data?.isKycCompleted ? data.isKycCompleted : false,
        officeContactNumber : data?.officeContactNumber ? data.officeContactNumber : 0,
        workingDays : data?.workingDays ? data.workingDays : [],
        status: data.status == 1 ? "Active" : "InActive",
        createdAt : data?.createdAt ? data.createdAt : '',
        dist : data?.dist ? data.dist : {},
        cabins : data?.cabins ? data.cabins : [],
        vendor: data && data.vendor && data.vendor.length > 0 ? data.vendor[0] : {},
        avgRatting: data?.avgRatting ? data.avgRatting : 0,
	};
};

exports.transformOffiecDetails = (data) => {
    let officeData = null;
    if(data){
        if(data && Array.isArray(data) && data.length > 0){
            return data.map(item => {
                return this.transformOfficeDetail(item);
            });
        }else{
            return this.transformOfficeDetail(data);
        }
    }
    return officeData;
}

exports.transformOffice = (data) => {
	return {

		_id: data._id,
		name: data?.name ? data.name : "",
        lat: data?.addressCordinater ? data.addressCordinater.coordinates[1] : 0.0,
        lang: data?.addressCordinater ? data.addressCordinater.coordinates[0] : 0.0,
        capacity: data.cabins && data.cabins.length >= 1 && data.cabins[0].capacity ? data.cabins[0].capacity : 2,
        price: data.cabins && data.cabins.length > 0 && data.cabins[0].price ? data.cabins[0].price : 0,
        image: data.cabins && data.cabins.length > 0 && data.cabins[0].images && data.cabins[0].images.length > 0 ? data.cabins[0].images[0] : "",
        avgRatting: data?.avgRatting ? data.avgRatting : 0,
        dist : data?.dist ? data.dist : {},
        status: data.status == 1 ? "Active" : "InActive",
	};
};

exports.transformListCollection = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformOffice(a));
        });
    }
    arrayData = data;
    return arrayData;
};
