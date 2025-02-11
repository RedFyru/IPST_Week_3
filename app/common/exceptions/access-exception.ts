import { CustomException } from "./custom-exception";

export class AccessException extends CustomException {
    constructor(message: string = "Access to task denied") {
        super(403, "Access to task denied", { publicMessage: message });
    }
}
