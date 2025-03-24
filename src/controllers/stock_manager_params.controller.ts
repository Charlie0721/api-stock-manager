import { Request, Response } from "express";
import { StocManagerParamsService } from "../service/stock_manager-params.service";
import { StockManagerParamsDto } from "../interface/stock_manager-params.dto";

const stockManagerParamsService = new StocManagerParamsService();

interface CustomError extends Error {
  status?: number;
}
export class StockManagerParamsController {
  static create = async (req: Request, res: Response) => {
    const { uuid } = req.params;

    const {
      Id_Vendedor,
      Id_Cliente,
      Id_Almacen,
      Edita_Precio,
      Edita_Descuento,
    } = req.body;

    const stockManagerParamsDto = new StockManagerParamsDto(
      Id_Vendedor,
      Id_Cliente,
      Id_Almacen,
      Edita_Precio,
      Edita_Descuento
    );

    try {
      const response = await stockManagerParamsService.create(
        uuid,
        stockManagerParamsDto
      );
      res.status(201).json({
        message: "stock-manager params created successfully",
        response,
      });
    } catch (error) {
      console.error("Error creating params:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static getOne = async (req: Request, res: Response) => {
    try {
      const uuid = req.params.Uuid_Usuario;
      const responseParams = await stockManagerParamsService.getOne(uuid);

      res.status(200).json(responseParams);
    } catch (error) {
      const customError = error as CustomError;
      if (customError.status === 404) {
        res.status(404).json({ message: "Not found" });
      } else {
        console.error("Error getting params:", customError);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  };
}
