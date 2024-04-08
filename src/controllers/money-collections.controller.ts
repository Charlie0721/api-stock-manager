import { MoneyCollectionDto } from "../interface/money-collection.dto";
import { MoneyCollectionService } from "../service/money-collections.service";
import { Request, Response } from "express";
const moneyCollectionService = new MoneyCollectionService();
export class MoneyCollectionController {
  static create = async (req: Request, res: Response) => {
    const {IdVendedor, IdCliente, Valor, Descripcion,eMail } = req.body;
    const moneyCollectionDto = new MoneyCollectionDto(IdVendedor, IdCliente,Valor, Descripcion,eMail);
    try {
      const response = await moneyCollectionService.create(moneyCollectionDto);

      res.status(201).json({
        message: "Money collection created successfully",
        response,
      });
    } catch (error) {
      console.error("Error creating money collection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  static findOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.IdRecaudo);

      const response = await moneyCollectionService.findOne(id);

      res.status(200).json({
        message: "data found satisfactorily",
        response,
      });
    } catch (error) {
      console.error("Error creating money collection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
