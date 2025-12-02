import { ref, type Ref } from 'vue';
import { message } from 'ant-design-vue';
import { DeviceApi } from '@/httpapis/api';
import type { Device } from '@/model/device';

type DeviceState = {
  isLoading: Ref<boolean>;
  data: Ref<Device[]>;
  searchKeyword: Ref<string>;
};

// 單例狀態：如果系統中已有數據體就使用該數據體，否則創建新的
let state: DeviceState | null = null;

export const useDeviceData = () => {
  // 如果系統中已有數據體，直接返回；否則創建新的數據體
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Device[]>([]),
      searchKeyword: ref(''),
    };
  }

  const sharedState = state!;

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
      title: '設備名稱',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '認證服務端口',
      dataIndex: 'icctv_auth_service_remote_port',
      key: 'icctv_auth_service_remote_port',
      width: 140,
    },
    {
      title: 'SSH端口',
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

  const list = async (ismartid?: string) => {
    sharedState.isLoading.value = true;
    if (ismartid !== undefined) {
      sharedState.searchKeyword.value = ismartid;
    }
    const keyword = sharedState.searchKeyword.value.trim();
    try {
      const response = await DeviceApi.list(keyword ? { ismartid: keyword } : undefined);
      const responseData = response.data.data as Device[];
      sharedState.data.value = responseData || [];
    } catch (error: any) {
      message.error(`獲取列表失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const fetch = async (id: number): Promise<Device> => {
    sharedState.isLoading.value = true;
    try {
      // 通過列表接口查找
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
      sharedState.isLoading.value = false;
    }
  };

  const create = async (data: {
    ismartid: string;
    name: string;
    icctv_auth_service_remote_port: number;
    ssh_remote_port: number;
    is_active?: boolean;
  }) => {
    sharedState.isLoading.value = true;
    try {
      await DeviceApi.create(data);
      message.success('創建成功');
      // 創建成功後，調用 list() 刷新共享的 data
      await list(sharedState.searchKeyword.value || undefined);
    } catch (error: any) {
      message.error(`創建失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
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
    id: number
  ) => {
    sharedState.isLoading.value = true;
    try {
      await DeviceApi.update(data, id);
      message.success('更新成功');
      // 更新成功後，調用 list() 刷新共享的 data
      await list(sharedState.searchKeyword.value || undefined);
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
      await DeviceApi.remove({ id });
      message.success('刪除成功');
      // 刪除成功後，調用 list() 刷新共享的 data
      await list(sharedState.searchKeyword.value || undefined);
    } catch (error: any) {
      message.error(`刪除失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const search = (keyword: string) => {
    sharedState.searchKeyword.value = keyword;
    list(keyword || undefined);
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