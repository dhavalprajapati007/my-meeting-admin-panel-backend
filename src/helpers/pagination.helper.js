module.exports.facetHelper = function (skip, limit) {
	return {
		$facet: {
			data: [
				{
					$skip: Number(skip) < 0 ? 0 : Number(skip) || 0,
				},
				{
					$limit: Number(limit) < 0 ? 10 : Number(limit) || 10,
				},
			],
			totalRecords: [
				{
					$count: "count",
				},
			],
		},
	};
};

module.exports.countHelper = function () {
	return {
		$project: {
			data: 1,
			totalCount: { $arrayElemAt: ["$totalRecords.count", 0] },
		},
	};
};
