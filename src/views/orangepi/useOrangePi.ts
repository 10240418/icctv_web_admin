import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { DeviceApi } from '@/httpapis/api';
import type { Device } from '@/model/device';

// 单例状态：如果系统中已有数据体就使用该数据体，否则创建新的
let state: {
  isLoading: ReturnType<typeof ref<boolean>>;
  data: ReturnType<typeof ref<Device[]>>;
  searchKeyword: ReturnType<typeof ref<string>>;
} | null = null;

export const useOrangePiData = () => {
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Device[]>([]),
      searchKeyword: ref(''),
    };
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'iSmart ID', dataIndex: 'ismartid', key: 'ismartid' },
    { title: '設備名稱', dataIndex: 'name', key: 'name' },
    {
      title: '認證服務端口',
      dataIndex: 'icctv_auth_service_remote_port',
      key: 'icctv_auth_service_remote_port',
      width: 140,
    },
    {
      title: 'SSH 遠程端口',
      dataIndex: 'ssh_remote_port',
      key: 'ssh_remote_port',
      width: 140,
    },
    {
      title: '狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
    },
  ];

  const list = async (ismartid?: string) => {
    state!.isLoading.value = true;
    try {
      const response = await DeviceApi.list(ismartid ? { ismartid } : undefined);
      const responseData = response.data.data as Device[];
      state!.data.value = responseData || [];
    } catch (error: any) {
      message.error(`獲取列表失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  const fetch = async (id: number): Promise<Device> => {
    state!.isLoading.value = true;
    try {
      const response = await DeviceApi.list();
      const responseData = response.data.data as Device[];
      const device = responseData.find((d) => d.id === id);
      if (!device) {
        throw new Error('設備不存在');
      }
      return device;
    } catch (error: any) {
      message.error(`獲取詳情失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  const create = async (data: {
    ismartid: string;
    name: string;
    icctv_auth_service_remote_port: number;
    ssh_remote_port: number;
    is_active?: boolean;
  }) => {
    state!.isLoading.value = true;
    try {
      await DeviceApi.create(data);
      message.success('創建成功');
      await list(state!.searchKeyword.value || undefined);
    } catch (error: any) {
      message.error(`創建失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  const update = async (
    data: {
      ismartid?: string;
      name?: string;
      icctv_auth_service_remote_port?: number;
      ssh_remote_port?: number;
      is_active?: boolean;
    },
    id: number,
  ) => {
    state!.isLoading.value = true;
    try {
      await DeviceApi.update(data, id);
      message.success('更新成功');
      await list(state!.searchKeyword.value || undefined);
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
      await DeviceApi.remove({ id });
      message.success('刪除成功');
      await list(state!.searchKeyword.value || undefined);
    } catch (error: any) {
      message.error(`刪除失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  const setSearchKeyword = (keyword: string) => {
    state!.searchKeyword.value = keyword;
  };

  return {
    isLoading: state!.isLoading,
    data: state!.data,
    searchKeyword: state!.searchKeyword,
    columns,
    list,
    fetch,
    create,
    update,
    remove,
    setSearchKeyword,
  };
};


