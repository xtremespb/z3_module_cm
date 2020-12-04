const calc = require("../../../api/calc").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            title: null,
            legacy: out.global.legacy,
            calcLegacy: null,
            tab: "generate",
            processValue: null,
        };
        this.state = state;
        this.holdingData = out.global.userHoldingData;
        this.i18n = out.global.i18n;
        this.routes = out.global.routes;
        this.routeDownload = out.global.routeDownload;
    }

    onMount() {
        this.generateModal = this.getComponent("z3_cm_generateModal");
        this.certModal = this.getComponent("z3_cm_certModal");
        this.cardForm = this.getComponent("z3_cm_cardForm");
        this.state.processValue = (id, value, column) => {
            switch (column) {
            case "date":
                return `${new Date(value).toLocaleDateString()} ${new Date(value).toLocaleTimeString()}`;
            case "cardType":
                return value.toUpperCase();
            default:
                return value;
            }
        };
    }

    onFormSubmit(dataForm) {
        const errors = [];
        let fatal = false;
        const data = dataForm.__default;
        const priceMin = this.holdingData.cards[data.cardType - 1].priceMin || 0;
        const priceMax = this.holdingData.cards[data.cardType - 1].priceMax || 0;
        const dateTimestamp = new Date(`${data.date[6]}${data.date[7]}${data.date[8]}${data.date[9]}`, parseInt(`${data.date[3]}${data.date[4]}`, 10) - 1, `${data.date[0]}${data.date[1]}`).getTime() / 1000;
        const currentTimestamp = parseInt(new Date().getTime() / 1000, 10);
        const allowedOffset = 5259492; // 2 months in seconds
        if (data.price && data.price !== 0) {
            if (priceMin && data.price < priceMin) {
                errors.push(this.i18n.t("priceMinConstraints"));
            }
            if (priceMax && data.price > priceMax) {
                errors.push(this.i18n.t("priceMaxConstraints"));
            }
        }
        if ((currentTimestamp > dateTimestamp && currentTimestamp - dateTimestamp > allowedOffset) || (currentTimestamp < dateTimestamp && dateTimestamp - currentTimestamp > allowedOffset)) {
            errors.push(this.i18n.t("timeConstraints"));
            fatal = true;
        }
        if (errors.length) {
            this.generateModal.func.setActive(true, errors, fatal);
            return;
        }
        this.cardForm.func.submitForm(true);
    }

    onConfirmClick() {
        this.cardForm.func.submitForm(true);
    }

    onButtonClick(data) {
        switch (data.id) {
        case "btnReset":
            this.cardForm.func.resetData();
            this.state.calcLegacy = null;
            this.state.title = null;
            this.cardForm.func.setFieldVisible("price", true);
            this.cardForm.func.setFieldVisible("cardNumber", true);
            this.cardForm.func.setFieldMandatory("creditMonths", false);
            this.cardForm.func.setFieldMandatory("cardNumber", true);
            this.cardForm.func.setFieldMandatory("price", true);
            this.cardForm.func.setFieldMandatory("years", false);
            this.cardForm.func.setFieldVisible("years", false);
            this.cardForm.func.setFieldVisible("creditSum", false);
            this.cardForm.func.setFieldVisible("creditMonths", false);
            this.cardForm.func.setFieldVisible("creditPercentage", false);
            this.cardForm.func.setFieldVisible("creditPercentageInfo", false);
            setTimeout(() => this.cardForm.func.autoFocus(), 1);
            break;
        case "btnPrintOffer":
            const win = window.open("/files/offer.pdf", "_blank");
            win.focus();
            win.print();
            break;
        }
    }

    onFormPostSuccess(result) {
        this.certModal.func.setActive(true, result.data.uid, result.data.uidAnnex);
    }

    calculatePercentage() {
        let percentageValue = parseFloat(this.price / (this.creditSum / 100));
        if (percentageValue % 1 > 0.01) {
            percentageValue = percentageValue.toFixed(2);
        } else {
            percentageValue = parseInt(percentageValue, 10);
        }
        percentageValue = `${percentageValue}%`;
        return percentageValue;
    }

    onFormValueChange(obj) {
        switch (obj.id) {
        case "cardType":
            if (this.state.legacy.manualPrice) {
                this.cardForm.func.setItemData("price", {
                    helpText: this.i18n.t(obj.value === "0" ? "priceHelpText" : "legacyCostHelpText")
                });
            }
            this.cardForm.func.setFieldVisible("cardNumber", obj.label !== "LEGACY");
            this.cardForm.func.setFieldMandatory("creditMonths", obj.label === "LEGACY");
            this.cardForm.func.setFieldMandatory("cardNumber", obj.label !== "LEGACY");
            if (!this.state.legacy.manualPrice) {
                this.cardForm.func.setFieldMandatory("price", obj.label !== "LEGACY");
                this.cardForm.func.setFieldVisible("creditPercentage", obj.label === "LEGACY");
                this.cardForm.func.setFieldVisible("price", obj.label !== "LEGACY");
                this.cardForm.func.setFieldVisible("creditPercentageInfo", false);
            } else {
                this.cardForm.func.setFieldVisible("creditPercentageInfo", obj.label === "LEGACY");
                this.cardForm.func.setFieldVisible("creditPercentage", false);
            }
            this.cardForm.func.setFieldMandatory("years", obj.label.match(/FOX/));
            this.cardForm.func.setFieldVisible("years", obj.label.match(/FOX/));
            this.cardForm.func.setFieldVisible("creditSum", obj.label === "LEGACY");
            this.cardForm.func.setFieldVisible("creditMonths", obj.label === "LEGACY");
            this.currentCardLabel = obj.label;
            break;
        case "creditSum":
            this.creditSum = parseInt(obj.value.replace(/\./gm, ""), 10);
            let percentageValue = "";
            if (this.currentCardLabel === "LEGACY" && this.state.legacy.manualPrice && this.price) {
                percentageValue = this.calculatePercentage();
            }
            this.cardForm.func.setValue("creditPercentageInfo", percentageValue);
            document.getElementById("creditPercentageInfo").value = percentageValue;
            break;
        case "room":
            this.setState("title", parseInt(obj.value, 10) ? obj.label : null);
            break;
        case "price":
            this.price = parseInt(obj.value.replace(/\./gm, ""), 10);
            let percentagePriceValue = "";
            if (this.currentCardLabel === "LEGACY" && this.state.legacy.manualPrice && this.creditSum) {
                percentagePriceValue = this.calculatePercentage();
            }
            this.cardForm.func.setValue("creditPercentageInfo", percentagePriceValue);
            document.getElementById("creditPercentageInfo").value = percentagePriceValue;
            break;
        }
        if (this.currentCardLabel === "LEGACY" && this.cardForm.func.getValue("creditSum") && this.cardForm.func.getValue("creditMonths") && this.cardForm.func.getValue("creditPercentage")) {
            const creditSum = this.cardForm.func.getValue("creditSum");
            const creditMonths = this.cardForm.func.getValue("creditMonths");
            const creditPercentage = this.cardForm.func.getValue("creditPercentage");
            const price = this.state.legacy.manualPrice ? this.cardForm.func.getValue("price") : null;
            const data = calc.legacy(this.state.legacy.ranges, this.state.legacy.components, creditSum, creditMonths, creditPercentage, price);
            this.state.calcLegacy = data;
        } else {
            this.state.calcLegacy = null;
        }
    }

    onFormSettled() {
        this.cardForm = this.getComponent("z3_cm_cardForm");
        this.cardForm.func.setFieldMandatory("creditMonths", false);
        this.cardForm.func.setFieldMandatory("cardNumber", true);
        this.cardForm.func.setFieldMandatory("price", true);
        this.cardForm.func.setFieldVisible("years", false);
        this.cardForm.func.setFieldVisible("creditSum", false);
        this.cardForm.func.setFieldVisible("creditMonths", false);
        this.cardForm.func.setFieldVisible("creditPercentage", false);
        this.cardForm.func.setFieldVisible("creditPercentageInfo", false);
    }

    onTabClick(e) {
        this.setState("tab", e.target.dataset.id);
    }

    onActionClick(data) {
        switch (data.action) {
        case "btnDownload":
            window.open(
                `${this.routeDownload}?id=${data.id}`,
                "_blank"
            );
            break;
        }
    }

    onTopButtonClick(data) {
        switch (data.button) {
        case "btnReload":
            this.getComponent("cmTable").func.dataRequest();
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }
};
