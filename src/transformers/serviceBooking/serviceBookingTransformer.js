exports.transform = (data) => {
	return {
		_id: data._id,
		userId: data?.userId ? data.userId : "",
		duration: data?.duration ? data.duration : {},
		date: data?.date ? data.date : "",
		paymentDetails: data?.paymentDetails ? data.paymentDetails : {},
        status: data.status == 1 ? "Active" : "InActive",
        office: data?.office ? data.office : [],
        cabin: data?.cabin ? data.cabin : [],
        serviceProvider: data?.serviceProvider ? data.serviceProvider : {},
        service: data?.service ? data.service : "",
        placeParticipants: data?.placeParticipants ? data.placeParticipants : [],
        virtualService: data?.virtualService ? data.virtualService : {},
        bookingUser: data?.bookingUser ? data.bookingUser : "",
        reviews: data?.reviews ? data.reviews : [],
        isCompleted: data?.isCompleted ? data.isCompleted : "",
        isServiceVerified: data?.isServiceVerified == 1 ? true : false,
        isPlaceVerified: data?.isPlaceVerified == 1 ? true : false,
        serviceType: data?.serviceType ? data.serviceType : 0,
        physicalType: data?.physicalType ? data.physicalType : 0,
        category : data?.category ? data.category : 0,
        serviceVerificationCode: data?.serviceVerificationCode ? data.serviceVerificationCode : "",
        placeVerificationCode: data?.placeVerificationCode ? data.placeVerificationCode : "",
        bookingUserInfo : data?.hasOwnProperty("bookingUserInfo") ? data?.bookingUserInfo : {},
        serviceProviderInfo : data?.hasOwnProperty("serviceProviderInfo") ? data?.serviceProviderInfo : {},
        vendorInfo : data?.hasOwnProperty("vendorInfo") ? data?.vendorInfo : {},
	};
};

exports.transformListCollection = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transform(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.transformVSB = (data) => {
    return {
        _id: data._id,
		userId: data?.userId ? data.userId : "",
		duration: data?.duration ? data.duration : {},
		date: data?.date ? data.date : "",
		paymentDetails: data?.paymentDetails ? data.paymentDetails : {},
		addressCordinater: data?.addressCordinater ? data.addressCordinater : {},
        status: data.status == 1 ? "Active" : "InActive",
        serviceId: data?.serviceId ? data.serviceId : "",
        serviceProviderId: data?.serviceProviderId ? data.serviceProviderId : "",
        isCompleted: data?.isCompleted ? data.isCompleted : "",
        serviceType: data.serviceType == 3 ? data.serviceType : "",
        virtualService: data?.virtualServiceDetail ? data.virtualServiceDetail : {}
    }
}

exports.transformServiceBooking = (data) => {
    return {
        _id: data._id,
		userId: data?.userId ? data.userId : "",
		duration: data?.duration ? data.duration : {},
		date: data?.date ? data.date : "",
		paymentDetails: data?.paymentDetails ? data.paymentDetails : {},
		addressCordinater: data?.addressCordinater ? data.addressCordinater : {},
        status: data.status == 1 ? "Active" : "InActive",
        serviceId: data?.serviceId ? data.serviceId : "",
        serviceProviderId: data?.serviceProviderId ? data.serviceProviderId : "",
        isCompleted: data?.isCompleted  ? data.isCompleted : "",
        serviceType: data?.serviceType ? data.serviceType : '',
        virtualService: data && data.virtualService && data.virtualService.length > 0 ? data.virtualService[0] : {},
        placeParticipants: data?.placeParticipants ? data.placeParticipants : [],
        placeBookingDetails: data?.placeBookingDetails ? data.placeBookingDetails : {},
        serviceProvider: data && data.serviceProvider && data.serviceProvider.length > 0 ? data.serviceProvider[0] : {},
        user: data && data.user && data.user.length > 0 ? data.user[0] : {},
        office: data && data.office && data.office.length > 0 ? data.office[0] : {},
        cabin: data && data.cabin && data.cabin.length > 0 ? data.cabin[0] : {},
        serviceVerificationCode: data?.serviceVerificationCode ? data.serviceVerificationCode : "",
        placeVerificationCode: data?.placeVerificationCode ? data.placeVerificationCode : "",
        physicalType: data?.physicalType ? data.physicalType : "",
        category : data?.category ? data.category : "",
        isServiceVerified: data?.isServiceVerified == 1 ? true : false,
        isPlaceVerified: data?.isPlaceVerified == 1 ? true : false,
        isCompleted: data?.isCompleted ? data.isCompleted : "",
    }
}

exports.transformGetBookingsByUser = (arrayData) => {
    let data = [];
    if(arrayData && arrayData.length > 0) {
        arrayData.forEach((item) => {
            data.push(this.transformServiceBooking(item));
        });
    }
    arrayData = data;
    return arrayData;
}


exports.transformDashboardCount = (data) => {
	return {
		userId: data?.userId ? data.userId : "",
		duration: data?.duration ? data.duration : "",
		date: data?.date ? data.date : "",
		paymentDetails: data?.paymentDetails ? data.paymentDetails : "",
	};
};