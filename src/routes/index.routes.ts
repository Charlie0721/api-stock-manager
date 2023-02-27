import {Router}  from 'express'
import { InventoryMovements } from '../controllers/inventoryMovements.controller';
import { SearchPrices } from '../controllers/searchDate.controller';
import { Product } from '../controllers/todosProductos.controller';
import {UpdateProduct, getProductById,addMultipleBarcodes } from '../controllers/updateProduct.controller';
import {ChargePurchases} from '../controllers/recordPurchases.controller'
import {inventoryQuantities} from '../controllers/checkInventoryQuantities.controller'
import { connectToApi } from '../controllers/setUrlToAPi.controller';
import {TradeOrder} from '../controllers/tradeOrder.controller'
import {DataCollector} from '../controllers/dataRecolector.controller'
import {ControlTime} from '../controllers/control_time'
const router = Router();
router.route('/search-prices').post(SearchPrices)
router.route('/all-products').get(Product.allProducts)
router.route('/update-products/:idproducto').put(UpdateProduct)
router.route('/product/:idproducto').get(getProductById)
router.route('/product/add-barcodes/:idproducto').post(addMultipleBarcodes)
router.route('/mov-inventarios/numero-entradas/:idalmacen').get(InventoryMovements.numberOfEntrie)
router.route('/mov-inventarios/terceros').get(InventoryMovements.listThirdParties)
router.route('/mov-inventarios/almacenes').get(InventoryMovements.listWarehouses)
router.route('/mov-inventarios/cabecera').post(InventoryMovements.saveInventoryMovement)
router.route('/mov-inventarios/id-movimiento').get(InventoryMovements.getIdMovement)
router.route('/mov-inventarios/obetener-cantidades/:idalmacen/stock').get(InventoryMovements.getProductStock)
router.route('/purchases/get-products').get(ChargePurchases.activeProductsToPurchases)
router.route('/purchases/get-warehouses').get(ChargePurchases.getWarehousestoPurchases)
router.route('/purchases/get-suppliers').get(ChargePurchases.getSuppliers)
router.route('/purchases/get-number/:idalmacen').get(ChargePurchases.numberPurchase)
router.route('/purchases/send-headers').post(ChargePurchases.savePurchase)
router.route('/purchases/get-taxes').get(ChargePurchases.getIva)
router.route('/purchases/get-id').get(ChargePurchases.getIdPurshable)
router.route('/products/get-quantities').get(inventoryQuantities)
router.route('/connect-api').post(connectToApi)
router.route('/trade-order/header').post(TradeOrder.insertOrder)
router.route('/trade-order/employee').get(TradeOrder.getEmployee)
router.route('/trade-order/customer').get(TradeOrder.getCustomer)
router.route('/trade-order/warehouse').get(TradeOrder.getWarehousestoOrders)
router.route('/trade-order/product/:idalmacen').get(TradeOrder.getProducts)
router.route('/trade-order/number/:idalmacen').get(TradeOrder.getNumberOrder)
router.route('/trade-order/get-id').get(TradeOrder.getIdTradeOrder)
router.route('/trade-order/get-order/:numero/:idalmacen').get(TradeOrder.ordersByWarehouseAndNumber)
router.route('/trade-order/create-client').post(TradeOrder.createClient)
router.route('/data-collector').post(DataCollector.searchProductBarcode)
router.route('/data-collector/create-file').post(DataCollector.createTextFile)
router.route('/data-collector/transfers').get(DataCollector.searchWarehousesActive)
router.route('/data-collector/transfers').post(DataCollector.createTextFileTransfers)
router.route('/control-time').get(ControlTime.controlTime)
export default router;