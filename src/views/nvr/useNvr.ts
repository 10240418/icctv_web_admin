import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { NvrApi } from '@/httpapis/api';
import type { Nvr, NvrList } from '@/model/nvr';

// 单例状态：如果系统中已有数据体就使用该数据体，否则创建新的
let state: {
  isLoading: ReturnType<typeof ref<boolean>>;
  data: ReturnType<typeof ref<Nvr[]>>;
} | null = null;

export const useNvrData = () => {
  // 如果系统中已有数据体，直接返回；否则创建新的数据体
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Nvr[]>([]),
    };
  }

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
    },
    {
      title: '訪問地址',
      dataIndex: 'url',
      key: 'url',
    },
    {
      title: '建築 ID',
      dataIndex: 'building_id',
      key: 'building_id',
      width: 120,
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '更新時間',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
    },
  ];

  const list = async () => {
    state!.isLoading.value = true;
    try {
      const response = await NvrApi.list();
      const responseData = response.data.data as NvrList | Nvr | Nvr[];

      if (Array.isArray(responseData)) {
        state!.data.value = responseData;
      } else if ('items' in responseData) {
        state!.data.value = responseData.items;
      } else {
        state!.data.value = responseData ? [responseData] : [];
      }
    } catch (error: any) {
      message.error(`獲取列表失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  const fetch = async (id: number): Promise<Nvr> => {
    state!.isLoading.value = true;
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
      state!.isLoading.value = false;
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
    state!.isLoading.value = true;
    try {
      await NvrApi.create(data);
      message.success('創建成功');
      await list();
    } catch (error: any) {
      message.error(`創建失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
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
    state!.isLoading.value = true;
    try {
      await NvrApi.update(data, id);
      message.success('更新成功');
      await list();
    } catch (error: any) {
      message.error(`更新失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
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

  return {
    ...state!,
    columns,
    list,
    fetch,
    create,
    update,
    remove,
  };
};


