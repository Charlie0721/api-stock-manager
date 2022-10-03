export interface IIngMovInvEntrada {

    fecha: string;
    idalmacen: string;
    detalle: string;
    estado: number;
    idconceptajuste: number;
    numero: number;
    idusuario: number;
    idtercero: string;
    ajustesinv: IIngMovInvEntradaDetalle[];

}

export interface IIngMovInvEntradaDetalle {

    idajuste: string;
    idproducto: number;
    idalmacen: string;
    entrada: number;
    salida: number;
   

}