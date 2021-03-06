/* eslint-disable prefer-destructuring */
const words = [
    [
        "", "один", "два", "три", "четыре", "пять", "шесть",
        "семь", "восемь", "девять", "десять", "одиннадцать",
        "двенадцать", "тринадцать", "четырнадцать", "пятнадцать",
        "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"
    ],
    [
        "", "", "двадцать", "тридцать", "сорок", "пятьдесят",
        "шестьдесят", "семьдесят", "восемьдесят", "девяносто"
    ],
    [
        "", "сто", "двести", "триста", "четыреста", "пятьсот",
        "шестьсот", "семьсот", "восемьсот", "девятьсот"
    ]
];
const rusRubles = ["рубль", "рубля", "рублей"];
const belRubles = ["белорусский рубль", "белорусских рубля", "белорусских рублей"];
const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

export default class {
    plural(count, options) {
        if (options.length !== 3) {
            return false;
        }
        count = Math.abs(count) % 100;
        const rest = count % 10;
        if (count > 10 && count < 20) {
            return options[2];
        }
        if (rest > 1 && rest < 5) {
            return options[1];
        }
        if (rest === 1) {
            return options[0];
        }
        return options[2];
    }

    parseNumber(number, count, currCode) {
        let first;
        let second;
        let numeral = "";
        if (number.length === 3) {
            first = number.substr(0, 1);
            number = number.substr(1, 3);
            numeral = `${words[2][first]} `;
        }

        if (number < 20) {
            numeral = `${numeral + words[0][Number.parseFloat(number)]} `;
        } else {
            first = number.substr(0, 1);
            second = number.substr(1, 2);
            numeral = `${numeral + words[1][first]} ${words[0][second]}`;
        }
        if (count === 0) {
            switch (currCode) {
            case "BYN": {
                numeral += ` ${this.plural(number, belRubles)}`;
                break;
            }
            case "RU":
            default: {
                numeral += ` ${this.plural(number, rusRubles)}`;
            }
            }
        } else if (count === 1) {
            if (numeral !== "  ") {
                numeral += this.plural(number, ["тысяча ", "тысячи ", "тысяч "]);
                numeral = numeral.replace("один ", "одна ").replace("два ", "две ");
            }
        } else if (count === 2) {
            if (numeral !== "  ") {
                numeral += this.plural(number, ["миллион ", "миллиона ", "миллионов "]);
            }
        } else if (count === 3) {
            numeral += this.plural(number, ["миллиард ", "миллиарда ", "миллиардов "]);
        }
        return numeral;
    }

    parseDecimals(number) {
        const text = this.plural(number, ["копейка", "копейки", "копеек"]);
        if (number === 0) {
            number = "00";
        } else if (number < 10) {
            number = `0${number}`;
        }
        return ` ${number} ${text}`;
    }

    rubles(number, currCode) {
        if (!number) {
            return false;
        }
        const type = typeof number;
        if (type !== "number" && type !== "string") {
            return false;
        }
        if (type === "string") {
            number = Number.parseFloat(number.replace(",", "."));
            if (Number.isNaN(number)) {
                return false;
            }
        }
        if (number <= 0) {
            return false;
        }
        let splt;
        let decimals;
        number = number.toFixed(2);
        if (number.indexOf(".") !== -1) {
            splt = number.split(".");
            number = splt[0];
            decimals = splt[1];
        }
        let numeral = "";
        let length = number.length - 1;
        let parts = "";
        let count = 0;
        let digit;
        while (length >= 0) {
            digit = number.substr(length, 1);
            parts = digit + parts;
            if ((parts.length === 3 || length === 0) && !Number.isNaN(Number.parseFloat(parts))) {
                numeral = this.parseNumber(parts, count, currCode) + numeral;
                parts = "";
                count += 1;
            }
            length -= 1;
        }
        numeral = numeral.replace(/\s+/g, " ");
        if (decimals) {
            numeral += this.parseDecimals(Number.parseFloat(decimals));
        }
        return numeral;
    }

    getRuMonthString(month) {
        return (!month || !parseInt(month, 10) || month < 1 || month > 12) ? "" : months[parseInt(month, 10) - 1];
    }

    getRuAgeString(age) {
        let txt;
        let count = age % 100;
        if (count >= 5 && count <= 20) {
            txt = "лет";
        } else {
            count %= 10;
            if (count === 1) {
                txt = "год";
            } else if (count >= 2 && count <= 4) {
                txt = "года";
            } else {
                txt = "лет";
            }
        }
        return txt;
    }

    getRuMonthsString(age) {
        let txt;
        let count = age % 100;
        if (count >= 5 && count <= 20) {
            txt = "месяцев";
        } else {
            count %= 10;
            if (count === 1) {
                txt = "месяц";
            } else if (count >= 2 && count <= 4) {
                txt = "месяца";
            } else {
                txt = "месяцев";
            }
        }
        return txt;
    }

    formatPhoneNumber(s) {
        return `+${s[0]} ${s[1]}${s[2]}${s[3]} ${s[4]}${s[5]}${s[6]}-${s[7]}${s[8]}-${s[9]}${s[10]}`;
    }

    formatMoney(amount, decimalCount = 2, decimal = ",", thousands = ".") {
        try {
            decimalCount = Math.abs(decimalCount);
            decimalCount = Number.isNaN(decimalCount) ? 2 : decimalCount;
            const negativeSign = amount < 0 ? "-" : "";
            const i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount), 10).toString();
            const j = (i.length > 3) ? i.length % 3 : 0;
            return negativeSign + (j ? i.substr(0, j) + thousands : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, `$1${thousands}`) + (decimalCount && Math.abs(amount - i) ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
        } catch {
            return amount;
        }
    }
}
