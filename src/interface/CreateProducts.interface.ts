export interface ProductsI {

    codigo: string;
    barcode?: string;
    descripcion: string;
    idunmedida: number;
    codiva: string;
    tipo: number;
    codivaesp1?: string;
    codivaesp2?: string;
    costo: number;
    ultcosto:number;
    precioventa: number;
    estado: number;
    compuesto: number;
    idareaserv?: number;
    codivacomp: string;
    agruparalfacturar?: number;
    estproductos: ProductStructureI[];    

}

export interface ProductStructureI {
    idproducto: number;
    idregistro: number;
    idnivel: number
}