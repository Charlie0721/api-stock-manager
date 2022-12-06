export interface ItradeOrderHeader {

    numero: number;
    idtercero: number;
    fecha: string;
    idvendedor: number;
    subtotal: number;
    valortotal: number;
    valdescuentos: number;
    valretenciones: number;
    idalmacen: number;
    estado: number;
    detalle?: string;
    fechacrea:string;
    hora:string;
    idsoftware: number;
    plazo: number;
    detpedidos: ItradeOrderDetail[];
}


export interface ItradeOrderDetail {

    idpedido: string;
    idproducto: number;
    cantidad: number;
    valorprod: number;
    descuento: number;
    codiva: string;
    porciva?: number;
    costoprod: number;
    despachado: number;


}