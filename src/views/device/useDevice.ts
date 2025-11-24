import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { DeviceApi } from '@/httpapis/api';
import type { Device } from '@/model/device';

// 单例状态：如果系统中已有数据体就使用该数据体，否则创建新的
let state: {
  isLoading: ReturnType<typeof ref<boolean>>;
  data: ReturnType<typeof ref<Device[]>>;
} | null = null;

export const useDeviceData = () => {
  // 如果系统中已有数据体，直接返回；否则创建新的数据体
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Device[]>([]),
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
      title: 'iSmart ID',
      dataIndex: 'ismartid',
      key: 'ismartid',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '认证服务端口',
      dataIndex: 'icctv_auth_service_remote_port',
      key: 'icctv_auth_service_remote_port',
      width: 120,
    },
    {
      title: 'SSH端口',
      dataIndex: 'ssh_remote_port',
      key: 'ssh_remote_port',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
    },
  ];

  const list = async (ismartid?: string) => {
    state!.isLoading.value = true;
    try {
      const response = await DeviceApi.list(ismartid ? { ismartid } : undefined);
      const responseData = response.data.data as Device[];
      state!.data.value = responseData || [];
    } catch (error: any) {
      message.error(`获取列表失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  const fetch = async (id: number): Promise<Device> => {
    state!.isLoading.value = true;
    try {
      // 通过列表接口查找
      const response = await DeviceApi.list();
      const responseData = response.data.data as Device[];
      const device = responseData.find((d) => d.id === id);
      if (!device) {
        throw new Error('设备不存在');
      }
      return device;
    } catch (error: any) {
      message.error(`获取详情失败: ${error.response?.data?.error || error.message}`);
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
      message.success('创建成功');
      // 创建成功后，调用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.error || error.message}`);
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
    id: number
  ) => {
    state!.isLoading.value = true;
    try {
      await DeviceApi.update(data, id);
      message.success('更新成功');
      // 更新成功后，调用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`更新失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  const remove = async (id: number) => {
    state!.isLoading.value = true;
    try {
      await DeviceApi.remove({ id });
      message.success('删除成功');
      // 删除成功后，调用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  return {
    ...state,       // 返回共享的响应式引用
    columns,
    list,
    fetch,
    create,
    update,
    remove,
  };
};

