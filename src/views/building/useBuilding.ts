import { ref, type Ref } from 'vue';
import { message } from 'ant-design-vue';
import { BuildingApi } from '@/httpapis/api';
import type { Building } from '@/model/building';

type BuildingState = {
  isLoading: Ref<boolean>;
  data: Ref<Building[]>;
  rawData: Ref<Building[]>;
  searchKeyword: Ref<string>;
};

// 單例狀態：如果系統中已有數據體就使用該數據體，否則創建新的
let state: BuildingState | null = null;

export const useBuildingData = () => {
  // 如果系統中已有數據體，直接返回；否則創建新的數據體
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Building[]>([]),
      rawData: ref<Building[]>([]),
      searchKeyword: ref(''),
    };
  }

  const sharedState = state!;

  const applyFilter = () => {
    const keyword = sharedState.searchKeyword.value.trim().toLowerCase();
    if (!keyword) {
      sharedState.data.value = [...sharedState.rawData.value];
      return;
    }
    sharedState.data.value = sharedState.rawData.value.filter((building) => {
      const name = building.name?.toLowerCase() || '';
      const id = building.ismartid?.toLowerCase() || '';
      return name.includes(keyword) || id.includes(keyword);
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'iSmart ID',
      dataIndex: 'ismartid',
      key: 'ismartid',
      width: 150,
    },
    {
      title: '建築名稱',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '備註',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
    },
    {
      title: '更新時間',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 200,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
    },
  ];

  const list = async () => {
    sharedState.isLoading.value = true;
    try {
      const response = await BuildingApi.list();
      const responseData = response.data.data as Building[];
      sharedState.rawData.value = responseData || [];
      applyFilter();
    } catch (error: any) {
      message.error(`獲取列表失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const fetch = async (id: number): Promise<Building> => {
    sharedState.isLoading.value = true;
    try {
      // 通過列表接口查找
      const response = await BuildingApi.list();
      const responseData = response.data.data as Building[];
      const building = responseData.find((b) => b.id === id);
      if (!building) {
        throw new Error('建築不存在');
      }
      return building;
    } catch (error: any) {
      message.error(`獲取詳情失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const create = async (data: {
    ismartid: string;
    name: string;
    remark?: string;
  }) => {
    sharedState.isLoading.value = true;
    try {
      await BuildingApi.create(data);
      message.success('創建成功');
      // 創建成功後，調用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`創建失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const update = async (
    data: {
      ismartid: string;
      name: string;
      remark?: string;
    },
    id: number
  ) => {
    sharedState.isLoading.value = true;
    try {
      await BuildingApi.update(data, id);
      message.success('更新成功');
      // 更新成功後，調用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`更新失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const remove = async (id: number) => {
    sharedState.isLoading.value = true;
    try {
      await BuildingApi.remove({ id });
      message.success('刪除成功');
      // 刪除成功後，調用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`刪除失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const search = (keyword: string) => {
    sharedState.searchKeyword.value = keyword;
    applyFilter();
  };

  return {
    isLoading: sharedState.isLoading,
    data: sharedState.data,
    searchKeyword: sharedState.searchKeyword,
    columns,
    list,
    fetch,
    create,
    update,
    remove,
    search,
  };
};

