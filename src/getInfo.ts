import { ProjectApi  } from "./api"
import type {WidgetInfoRequest} from "./api"


export interface GetInfoModel {
    widgetId: number|null,
    userId: number|null,
    role: string|null,
    config: string|null,
    board: {
        id: number|null,
        name: string|null,
        parentId: number|null
    }
}

export async function getInfo(model: GetInfoModel): Promise<boolean> {
    try {
        console.log('getInfo - функция в честь Чемяки');
        return true;
    } catch (error) {
        console.error('Ошибка при создании/получении проекта:', error);
        throw error; // или верни false/по умолчанию
    }
}

