import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { DeviceApi, OrangePiRemoteApi, AuthApi } from '@/httpapis/api';
import type { Device } from '@/model/device';
import type {
  OrangePiRemoteInfo,
  OrangePiRemoteHealth,
  MediaMTXPathsResponse,
  MediaMTXPathDetail,
  PublicTokenResponse,
} from '@/model/orangepi';

// 單例狀態：如果系統中已有數據體就使用該數據體，否則創建新的
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
    { title: 'iSmart ID', dataIndex: 'ismartid', key: 'ismartid', width: 150 },
    { title: '設備名稱', dataIndex: 'name', key: 'name', width: 200 },
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
    user_channels?: number[];
    all_channels?: number[];
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
      user_channels?: number[];
      all_channels?: number[];
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

  // 遠程管理相關方法
  const generateStaffToken = async (ismartid: string): Promise<PublicTokenResponse> => {
    try {
      // @ts-ignore
      const response = await AuthApi.publicToken({ ismartid, is_staff: true }, null);
      return response.data.data;
    } catch (error: any) {
      message.error(`生成Token失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
  };

  const getRemoteInfo = async (id: number, token: string): Promise<OrangePiRemoteInfo> => {
    try {
      const response = await OrangePiRemoteApi.getInfo(id, token);
      return response.data.data;
    } catch (error: any) {
      message.error(`獲取設備信息失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
  };

  const getRemoteHealth = async (id: number): Promise<OrangePiRemoteHealth> => {
    try {
      const response = await OrangePiRemoteApi.getHealth(id);
      return response.data.data;
    } catch (error: any) {
      message.error(`獲取健康檢查失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
  };

  const listRemotePaths = async (
    id: number,
    token: string,
    page = 0,
    itemsPerPage = 50,
  ): Promise<MediaMTXPathsResponse> => {
    try {
      const response = await OrangePiRemoteApi.listPaths({
        id,
        token,
        page,
        items_per_page: itemsPerPage,
      });
      return response.data.data;
    } catch (error: any) {
      message.error(`獲取Paths列表失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
  };

  const getRemotePathDetail = async (
    id: number,
    token: string,
    name: string,
  ): Promise<MediaMTXPathDetail> => {
    try {
      const response = await OrangePiRemoteApi.getPathDetail({ id, token, name });
      return response.data.data;
    } catch (error: any) {
      message.error(`獲取Path詳情失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
  };

  const addRemotePath = async (
    id: number,
    token: string,
    name: string,
    config: any,
  ) => {
    try {
      const response = await OrangePiRemoteApi.addPath({ id, token, name, config });
      message.success('新增Path成功');
      return response.data.data;
    } catch (error: any) {
      message.error(`新增Path失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
  };

  const updateRemotePath = async (
    id: number,
    token: string,
    name: string,
    config: any,
  ) => {
    try {
      const response = await OrangePiRemoteApi.updatePath({ id, token, name, config });
      message.success('更新Path成功');
      return response.data.data;
    } catch (error: any) {
      message.error(`更新Path失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
  };

  const deleteRemotePath = async (id: number, token: string, name: string) => {
    try {
      const response = await OrangePiRemoteApi.deletePath({ id, token, name });
      message.success('刪除Path成功');
      return response.data.data;
    } catch (error: any) {
      message.error(`刪除Path失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
  };

  // 遠程更新FRPC端口
  const remoteUpdatePorts = async (
    id: number,
    sshRemotePort: number,
    authRemotePort: number,
  ) => {
    try {
      const response = await OrangePiRemoteApi.updatePorts({
        id,
        ssh_remote_port: sshRemotePort,
        icctv_auth_service_remote_port: authRemotePort,
      });
      message.success('遠程更新FRPC端口成功');
      return response.data.data;
    } catch (error: any) {
      message.error(`遠程更新FRPC端口失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    }
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
    // 遠程管理方法
    generateStaffToken,
    getRemoteInfo,
    getRemoteHealth,
    listRemotePaths,
    getRemotePathDetail,
    addRemotePath,
    updateRemotePath,
    deleteRemotePath,
    remoteUpdatePorts,
  };
};



