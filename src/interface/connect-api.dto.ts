
export class ConnectToApiDto {

    private header: string;
    private iP1: string;
    private pointOne: string;
    private iP2: string;
    private pointTwo: string;
    private iP3: string;
    private pointThree: string;
    private iP4: string;
    private twoPoints: string;
    private port: string;

    public constructor(header: string, iP1: string, pointOne: string, iP2: string, pointTwo: string,
        iP3: string, pointThree: string, iP4: string, twoPoints: string, port: string) {
        this.header = header;
        this.iP1 = iP1;
        this.pointOne = pointOne;
        this.iP2 = iP2;
        this.pointTwo = pointTwo;
        this.iP3 = iP3;
        this.pointThree = pointThree;
        this.iP4 = iP4;
        this.twoPoints = twoPoints;
        this.port = port;
    }

    public getHeader(): string {
        return this.header
    }

    public setHeader(header: string) {
        this.header = header;
    }

    public getIp1(): string {
        return this.iP1
    }

    public setIp1(iP1: string) {
        this.iP1 = iP1;
    }

    public getPointOne(): string {
        return this.pointOne
    }

    public setPointOne(pointOne: string) {
        this.pointOne = pointOne;
    }

    public getIp2(): string {
        return this.iP2
    }
    public setIp2(iP2: string) {
        this.iP2 = iP2;
    }

    public getPointTwo(): string {
        return this.pointTwo
    }
    public setPointTwo(pointTwo: string) {
        this.pointTwo = pointTwo;
    }

    public getIp3(): string {
        return this.iP3
    }

    public setIp3(iP3: string) {
        this.iP3 = iP3;
    }

    public getPointThree(): string {
        return this.pointThree
    }
    public setPointThree(pointThree: string) {
        this.pointThree = pointThree;
    }

    public getIp4(): string {
        return this.iP4
    }
    public setIp4(iP4: string) {
        this.iP4 = iP4;
    }

    public getTwoPoints(): string {
        return this.twoPoints
    }
    public setTwoPoints(twoPoints: string) {
        this.twoPoints = twoPoints;
    }

    public getPort(): string {
        return this.port
    }
    public setPort(port: string) {
        this.port = port;
    }

}