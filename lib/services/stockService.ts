import connectMongo from '@/lib/mongodb';
import { Product, StockMovement } from '@/lib/models';

export interface StockMovementData {
  productId: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  reason: string;
  observation?: string;
  userId: string;
  userName: string;
}

export class StockService {
  static async createMovement(data: StockMovementData) {
    await connectMongo();
    
    const product = await Product.findById(data.productId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const previousStock = product.stock;
    let newStock: number;

    switch (data.type) {
      case 'entrada':
        newStock = previousStock + data.quantity;
        break;
      case 'saida':
        newStock = previousStock - data.quantity;
        if (newStock < 0) {
          throw new Error('Estoque insuficiente para esta operação');
        }
        break;
      case 'ajuste':
        newStock = data.quantity;
        break;
      default:
        throw new Error('Tipo de movimentação inválido');
    }

    // Create movement record
    const movement = new StockMovement({
      ...data,
      productName: product.name,
      previousStock,
      newStock,
    });

    // Update product stock
    product.stock = newStock;

    // Save both in a transaction-like approach
    await movement.save();
    await product.save();

    return movement;
  }

  static async getMovements(productId?: string, limit = 50) {
    await connectMongo();
    
    const query = productId ? { productId } : {};
    
    return await StockMovement.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productId', 'name code')
      .populate('userId', 'name');
  }

  static async getLowStockProducts(threshold = 5) {
    await connectMongo();
    
    return await Product.find({
      active: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    }).sort({ stock: 1 });
  }
}