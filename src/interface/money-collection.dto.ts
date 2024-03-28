export class MoneyCollectionDto {
    private Valor: number;
    private Descripcion: string;

    constructor(Valor: number, Descripcion: string) {
        this.Valor = Valor;
        this.Descripcion = Descripcion;
    }

    getValor(): number {
        return this.Valor;
    }

    setValor(nuevoValor: number) {
        this.Valor = nuevoValor;
    }

    getDescripcion(): string {
        return this.Descripcion;
    }

    setDescripcion(nuevaDescripcion: string) {
        this.Descripcion = nuevaDescripcion;
       
    }
}
