import { FavoriteRepository } from '../../../infrastructure/database/FavoriteRepository.js';
import { RecipeRepository } from '../../../infrastructure/database/RecipeRepository.js';
import { FavoriteService } from '../../../application/favorite/FavoriteService.js';

const favoriteService = new FavoriteService(new FavoriteRepository(), new RecipeRepository());

export async function listFavorites(req, res, next) {
  try {
    const result = await favoriteService.listFavorites(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function addFavorite(req, res, next) {
  try {
    const result = await favoriteService.addFavorite(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function removeFavorite(req, res, next) {
  try {
    const result = await favoriteService.removeFavorite(req.user.id, req.params.recipeId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
