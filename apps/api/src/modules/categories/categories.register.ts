import { type AwilixContainer, asFunction } from "awilix";
import { createCategoriesRepository } from "./categories.repository.js";

/** One call from `container.ts` registers this feature (DESIGN 4.4). */
export function registerCategoriesModule(container: AwilixContainer): void {
  container.register({
    categoriesRepository: asFunction(createCategoriesRepository).singleton(),
  });
}
