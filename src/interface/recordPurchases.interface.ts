export interface IHeaderPurchases {


    idtercero: string;
    docprovee: number;
    prefijo?: string;
    numero: number;
    fechadocprov: string;
    fecha: string;
    detalle: string;
    idalmacen: string;
    idpago: number;
    aprobada: number;
    detcompras: IPurchasesDetails[]; 
}

export interface IPurchasesDetails {

    
    idcompra: string;
    idmovorden?: number;
    idproducto: number;
    porciva?: number;
    codiva: string;
    valor?: number;
    cantidad: number;
    precioventa?: number;



}