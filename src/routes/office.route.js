const express = require("express");
const router = express.Router();
const officeController = require("../controller/office.controller");
const { verifyAuthToken, verifySuperAdminToken } = require("../middleware/verifyToken");

router.post("/add", officeController.add);
router.put("/update", officeController.update);
router.get("/get", officeController.getOfficeDetails);
router.get("/get-by-userid", officeController.getByUserId);
router.post("/getOfficesByLocation", officeController.getOfficesByGeoLocation);
router.post("/get-all", verifyAuthToken, officeController.getAll);
router.get("/get-all-locations",verifyAuthToken, officeController.getOfficeLocations);
router.get("/get-totals", verifyAuthToken, officeController.getTotals);

// TODO: need to saprate cabin controller & routes
router.post("/addCabin", officeController.addCabin);
router.put("/updateCabin", officeController.updateCabin);
router.delete("/deleteCabin", officeController.deleteCabin);
router.post("/delete-cabin-image", verifyAuthToken, officeController.removeCabinImages);

// Super Admin
router.delete("/delete",verifySuperAdminToken,officeController.delete);

module.exports = router;