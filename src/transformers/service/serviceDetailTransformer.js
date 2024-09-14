exports.transformService = (data) => {
	return {
		_id: data._id,
		status: data.status,
		name: data?.name ? data.name : "",
		description: data?.description ? data.description : "",
		image: data?.image ? data.image : "",
        parent: data?.parent ? data.parent : ""
	};
};

exports.transformServiceDetails = (parent, child) => {
    let serviceData = null;
    if(parent){
        serviceData = this.transformService(parent);
        if(child && child.length > 0) serviceData.childs = child;
    }
    return serviceData;
}