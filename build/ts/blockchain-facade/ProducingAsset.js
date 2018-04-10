"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Asset_1 = require("./Asset");
var AssetType;
(function (AssetType) {
    AssetType[AssetType["Wind"] = 0] = "Wind";
    AssetType[AssetType["Solar"] = 1] = "Solar";
    AssetType[AssetType["RunRiverHydro"] = 2] = "RunRiverHydro";
    AssetType[AssetType["BiomassGas"] = 3] = "BiomassGas";
})(AssetType = exports.AssetType || (exports.AssetType = {}));
var Compliance;
(function (Compliance) {
    Compliance[Compliance["none"] = 0] = "none";
    Compliance[Compliance["IREC"] = 1] = "IREC";
    Compliance[Compliance["EEC"] = 2] = "EEC";
    Compliance[Compliance["TIGR"] = 3] = "TIGR";
})(Compliance = exports.Compliance || (exports.Compliance = {}));
class ProducingAsset extends Asset_1.Asset {
    static GET_ASSET_LIST_LENGTH(blockchainProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            return parseInt(yield blockchainProperties.producingAssetLogicInstance.methods.getAssetListLength().call(), 10);
        });
    }
    static GET_ALL_ASSETS(blockchainProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            const assetsPromises = Array(yield ProducingAsset.GET_ASSET_LIST_LENGTH(blockchainProperties))
                .fill(null)
                .map((item, index) => (new ProducingAsset(index, blockchainProperties)).syncWithBlockchain());
            return Promise.all(assetsPromises);
        });
    }
    static GET_ALL_ASSET_OWNED_BY(owner, blockchainProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield ProducingAsset.GET_ALL_ASSETS(blockchainProperties))
                .filter((asset) => asset.owner.toLowerCase() === owner.toLowerCase());
        });
    }
    static CREATE_ASSET(assetProperties, blockchainProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            const gasCreate = yield blockchainProperties.producingAssetLogicInstance.methods
                .createAsset()
                .estimateGas({ from: blockchainProperties.assetAdminAccount });
            const txCreate = yield blockchainProperties.producingAssetLogicInstance.methods
                .createAsset()
                .send({ from: blockchainProperties.assetAdminAccount, gas: Math.round(gasCreate * 1.1) });
            const assetId = parseInt(txCreate.events.LogAssetCreated.returnValues._assetId, 10);
            const initGeneralParams = [
                assetId,
                assetProperties.smartMeter,
                assetProperties.owner,
                assetProperties.operationalSince,
                assetProperties.active
            ];
            const gasInitGeneral = yield blockchainProperties.producingAssetLogicInstance.methods
                .initGeneral(...initGeneralParams)
                .estimateGas({ from: blockchainProperties.assetAdminAccount });
            const txInitGeneral = yield blockchainProperties.producingAssetLogicInstance.methods
                .initGeneral(...initGeneralParams)
                .send({ from: blockchainProperties.assetAdminAccount, gas: Math.round(gasInitGeneral * 1.1) });
            const initProducingPrams = [
                assetId,
                assetProperties.assetType,
                assetProperties.capacityWh,
                assetProperties.complianceRegistry,
                blockchainProperties.web3.utils.fromUtf8(assetProperties.otherGreenAttributes),
                blockchainProperties.web3.utils.fromUtf8(assetProperties.typeOfPublicSupport)
            ];
            const gasInitProducing = yield blockchainProperties.producingAssetLogicInstance.methods
                .initProducingProperties(...initProducingPrams)
                .estimateGas({ from: blockchainProperties.assetAdminAccount });
            const txInitProducing = yield blockchainProperties.producingAssetLogicInstance.methods
                .initProducingProperties(...initProducingPrams)
                .send({ from: blockchainProperties.assetAdminAccount, gas: Math.round(gasInitProducing * 1.1) });
            const initLocationParams = [
                assetId,
                blockchainProperties.web3.utils.fromUtf8(assetProperties.country),
                blockchainProperties.web3.utils.fromUtf8(assetProperties.region),
                blockchainProperties.web3.utils.fromUtf8(assetProperties.zip),
                blockchainProperties.web3.utils.fromUtf8(assetProperties.city),
                blockchainProperties.web3.utils.fromUtf8(assetProperties.street),
                blockchainProperties.web3.utils.fromUtf8(assetProperties.houseNumber),
                blockchainProperties.web3.utils.fromUtf8(assetProperties.gpsLatitude),
                blockchainProperties.web3.utils.fromUtf8(assetProperties.gpsLongitude)
            ];
            const gasInitLocation = yield blockchainProperties.producingAssetLogicInstance.methods
                .initLocation(...initLocationParams)
                .estimateGas({ from: blockchainProperties.assetAdminAccount });
            const txInitLocation = yield blockchainProperties.producingAssetLogicInstance.methods
                .initLocation(...initLocationParams)
                .send({ from: blockchainProperties.assetAdminAccount, gas: Math.round(gasInitLocation * 1.1) });
            return (new ProducingAsset(assetId, blockchainProperties)).syncWithBlockchain();
        });
    }
    syncWithBlockchain() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.id != null) {
                const structDataPromises = [];
                structDataPromises.push(this.blockchainProperties.producingAssetLogicInstance.methods.getAssetGeneral(this.id).call());
                structDataPromises.push(this.blockchainProperties.producingAssetLogicInstance.methods.getAssetProducingProperties(this.id).call());
                structDataPromises.push(this.blockchainProperties.producingAssetLogicInstance.methods.getAssetLocation(this.id).call());
                const demandData = yield Promise.all(structDataPromises);
                this.smartMeter = demandData[0]._smartMeter;
                this.owner = demandData[0]._owner;
                this.operationalSince = parseInt(demandData[0]._operationalSince, 10);
                this.lastSmartMeterReadWh = parseInt(demandData[0]._lastSmartMeterReadWh, 10);
                this.active = demandData[0]._active;
                this.lastSmartMeterReadFileHash = demandData[0]._lastSmartMeterReadFileHash;
                this.assetType = parseInt(demandData[1].assetType, 10);
                this.capacityWh = parseInt(demandData[1].capacityWh, 10);
                this.certificatesCreatedForWh = parseInt(demandData[1].certificatesCreatedForWh, 10);
                this.lastSmartMeterCO2OffsetRead = parseInt(demandData[1].lastSmartMeterCO2OffsetRead, 10);
                this.cO2UsedForCertificate = parseInt(demandData[1].cO2UsedForCertificate, 10);
                this.complianceRegistry = parseInt(demandData[1].registryCompliance, 10);
                this.otherGreenAttributes = this.blockchainProperties.web3.utils.hexToUtf8(demandData[1].otherGreenAttributes);
                this.typeOfPublicSupport = this.blockchainProperties.web3.utils.hexToUtf8(demandData[1].typeOfPublicSupport);
                // Location
                this.country = this.blockchainProperties.web3.utils.hexToUtf8(demandData[2].country);
                this.region = this.blockchainProperties.web3.utils.hexToUtf8(demandData[2].region);
                this.zip = this.blockchainProperties.web3.utils.hexToUtf8(demandData[2].zip);
                this.city = this.blockchainProperties.web3.utils.hexToUtf8(demandData[2].city);
                this.street = this.blockchainProperties.web3.utils.hexToUtf8(demandData[2].street);
                this.houseNumber = this.blockchainProperties.web3.utils.hexToUtf8(demandData[2].houseNumber);
                this.gpsLatitude = this.blockchainProperties.web3.utils.hexToUtf8(demandData[2].gpsLatitude);
                this.gpsLongitude = this.blockchainProperties.web3.utils.hexToUtf8(demandData[2].gpsLongitude);
                this.initialized = true;
            }
            return this;
        });
    }
    getCoSaved(wh) {
        const lastRead = this.lastSmartMeterReadWh;
        const lastUsedWh = this.certificatesCreatedForWh;
        const availableWh = lastRead - lastUsedWh;
        if (availableWh == 0) {
            return 0;
        }
        const coRead = this.lastSmartMeterCO2OffsetRead;
        const coUsed = this.cO2UsedForCertificate;
        const availableCo = coRead - coUsed;
        return (availableCo * ((wh * 1000000) / availableWh)) / 1000000;
    }
    getAssetEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.blockchainProperties.producingAssetLogicInstance.getPastEvents('allEvents', {
                fromBlock: 0,
                toBlock: 'latest',
                //     topics: [null, this.blockchainProperties.web3.utils.padLeft(this.blockchainProperties.web3.utils.fromDecimal(this.id), 64, '0'), null]
                topics: [null, this.blockchainProperties.web3.utils.padLeft(this.blockchainProperties.web3.utils.fromDecimal(this.id), 64, '0')]
            }));
        });
    }
    getEventWithFileHash(fileHash) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.blockchainProperties.producingAssetLogicInstance.getPastEvents('allEvents', {
                fromBlock: 0,
                toBlock: 'latest',
                topics: [null, this.blockchainProperties.web3.utils.padLeft(this.blockchainProperties.web3.utils.fromDecimal(this.id), 64, '0'), fileHash]
            }));
        });
    }
}
exports.ProducingAsset = ProducingAsset;
//# sourceMappingURL=ProducingAsset.js.map