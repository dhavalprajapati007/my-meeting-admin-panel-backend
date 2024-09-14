exports.transformUser = (data) => {
	if(data.role && data.role == 1){
		return {
			_id: data._id,
			firstName: data?.firstName ? data.firstName : "",
			lastName: data?.lastName ? data.lastName : "",
			mobile: data?.mobile ? data.mobile : "",
			email: data?.email ? data.email : "",
			avatar: data?.avatar ? data.avatar : "",
			addressCordinater : data?.addressCordinater ? data.addressCordinater : {},
			role: "User",
			status: data.status == 1 ? "Active" : "InActive",
		};
	}
	return {
		_id: data._id,
		firstName: data?.firstName ? data.firstName : "",
		lastName: data?.lastName ? data.lastName : "",
		mobile: data?.mobile ? data.mobile : 00000000000,
		email: data?.email ? data.email : "",
		avatar: data?.avatar ? data.avatar : "",
		occupation: data?.occupation ? data.occupation : "",
		role : data?.role == 1 ? 'User' : data?.role == 2 ? 'Vendor' : data?.role == 3 ? 'Admin' : 'Super Admin',
		addressCordinater : data?.addressCordinater ? data.addressCordinater : { lat : "00.00", lang: '00.00' },
		deviceId: data?.deviceId ? data.deviceId : "",
		stipeCustomerId: data?.stipeCustomerId ? data.stipeCustomerId : "",
		lastLogin: data?.lastLogin ? data.lastLogin : "",
		status: data.status == 1 ? "Active" : "InActive",
		vendorDetails: data?.vendorDetails ? data.vendorDetails : {},
		vendorService : data?.vendorService ? data.vendorService : {},
		vendorTimeslot: data?.vendorTimeslot ? data.vendorTimeslot : [],
		avgRatting: data?.avgRatting ? data.avgRatting : 0,
		totalBookings: data?.totalBookings ? data.totalBookings : 0,
		reviews: data?.reviews ? data.reviews : [],
		totalReviews : data?.reviews && data?.reviews.length > 0 ? data.reviews.length : 0
	};
};

exports.transformListCollection = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformUser(a));
        });
    }
    arrayData = data;
    return arrayData;
};
