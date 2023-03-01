export interface ITransfer {

    fecha: string;
    detalle?: string;
    tipotraslado: number;
    idalmacen: number;
    idalmdest: number;
    estado: number;
    fechacrea: string;
    hora: string;
    documento: string;
    numtrasladoorigen: number;
    dettraslado: IDetailTransfer[];

}


export interface IDetailTransfer {

    idtraslado: string;
    idproducto: number;
    cantidad: number;
    idalmacendest: number;
    costo: number;
    precio: number;


}