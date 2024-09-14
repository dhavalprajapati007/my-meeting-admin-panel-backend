exports.transformVendorDetailData = (data) => {
	return {
		_id: data.user[0]?._id ? data.user[0]._id : "",
		firstName: data.user[0]?.firstName ? data.user[0].firstName : "",
		lastName: data.user[0]?.lastName ? data.user[0].lastName : "",
		mobile: data.user[0]?.mobile ? data.user[0].mobile : "",
		email: data.user[0]?.email ? data.user[0].email : "",
		avatar: data.user[0]?.avatar ? data.user[0].avatar : "",
		occupation: data.user[0]?.occupation ? data.user[0].occupation : "",
		role : data.user[0]?.role == 1 ? 'User' : data.user[0]?.role == 2 ? 'Vendor' : data.user[0]?.role == 3 ? 'Admin' : 'Super Admin',
		addressCordinater : data.user[0]?.addressCordinater ? data.user[0].addressCordinater : {},
		deviceId: data.user[0]?.deviceId ? data.user[0].deviceId : "",
		stipeCustomerId: data.user[0]?.stipeCustomerId ? data.user[0].stipeCustomerId : "",
		lastLogin: data.user[0]?.lastLogin ? data.user[0].lastLogin : "",
		status: data.user[0].status == 1 ? "Active" : "InActive",
		vendorDetails: data.user[0]?.vendorDetails ? data.user[0].vendorDetails : "",
		registrationStep: data.user[0]?.registrationStep ? data.user[0].registrationStep : "",
        avgRatting: data?.avgRatting ? data.avgRatting : 0,
        reviews: data?.reviews ? data.reviews : [],
        totalReviews: data?.reviews && data.reviews.length > 0 ? data.reviews.length : 0,
        vendorService: {
            service: data.service[0].name,
            bio: data?.bio ? data.bio : "",
            instruction: data?.instruction ? data.instruction : "",
            fees: data?.fees ? data.fees : "",
            prefrence : data?.prefrence ? data.prefrence : "",
            certificates: data?.certificates ? data.certificates : "",
            languages: data?.languages ? data.languages : "",
            available: data?.available ? data.available : "",
            status: data && data.status == 1 ? "Active" : "InActive"
        }
	};
};

exports.transformListCollection = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformVendorDetailData(a));
        });
    }
    arrayData = data;
    return arrayData;
};
