import { ref, type Ref } from 'vue';
import { message } from 'ant-design-vue';
import { NvrApi } from '@/httpapis/api';
import type { Nvr, NvrList } from '@/model/nvr';

type NvrState = {
  isLoading: Ref<boolean>;
  data: Ref<Nvr[]>;
  rawData: Ref<Nvr[]>;
  searchKeyword: Ref<string>;
};

// 單例狀態：如果系統中已有數據體就使用該數據體，否則創建新的
let state: NvrState | null = null;

export const useNvrData = () => {
  // 如果系統中已有數據體，直接返回；否則創建新的數據體
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Nvr[]>([]),
      rawData: ref<Nvr[]>([]),
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
    sharedState.data.value = sharedState.rawData.value.filter((nvr) => {
      const name = nvr.name?.toLowerCase() || '';
      const url = nvr.url?.toLowerCase() || '';
      return name.includes(keyword) || url.includes(keyword);
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
      title: '名稱',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '訪問地址',
      dataIndex: 'url',
      key: 'url',
      width: 250,
    },
    {
      title: '建築 ID',
      dataIndex: 'building_id',
      key: 'building_id',
      width: 120,
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
      const response = await NvrApi.list();
      const responseData = response.data.data as NvrList | Nvr | Nvr[];

      if (Array.isArray(responseData)) {
        sharedState.rawData.value = responseData;
      } else if ('items' in responseData) {
        sharedState.rawData.value = responseData.items;
      } else {
        sharedState.rawData.value = responseData ? [responseData] : [];
      }
      applyFilter();
    } catch (error: any) {
      message.error(`獲取列表失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const fetch = async (id: number): Promise<Nvr> => {
    sharedState.isLoading.value = true;
    try {
      const response = await NvrApi.list({ id });
      const responseData = response.data.data as NvrList | Nvr | Nvr[];

      if (!responseData) {
        throw new Error('NVR 不存在');
      }

      if (Array.isArray(responseData)) {
        const found = responseData.find((n) => n.id === id);
        if (!found) throw new Error('NVR 不存在');
        return found;
      }

      if ('items' in responseData) {
        const found = responseData.items.find((n) => n.id === id);
        if (!found) throw new Error('NVR 不存在');
        return found;
      }

      return responseData as Nvr;
    } catch (error: any) {
      message.error(`獲取詳情失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const create = async (data: {
    name: string;
    url: string;
    building_id: number;
    admin_user?: { name: string; password: string };
    users?: Array<{ name: string; password: string }>;
    rtsp_urls?: Array<{ channel: number; url: string }>;
  }) => {
    sharedState.isLoading.value = true;
    try {
      await NvrApi.create(data);
      message.success('創建成功');
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
      name?: string;
      url?: string;
      building_id?: number;
      admin_user?: { name: string; password: string };
      users?: Array<{ name: string; password: string }>;
      rtsp_urls?: Array<{ channel: number; url: string }>;
    },
    id: number,
  ) => {
    sharedState.isLoading.value = true;
    try {
      await NvrApi.update(data, id);
      message.success('更新成功');
      await list();
    } catch (error: any) {
      message.error(`更新失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const remove = async (id: number) => {
    state!.isLoading.value = true;
    try {
      await NvrApi.remove({ id });
      message.success('刪除成功');
      await list();
    } catch (error: any) {
      message.error(`刪除失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
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
    search,
    fetch,
    create,
    update,
    remove,
  };
};


