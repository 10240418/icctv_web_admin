import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { BuildingApi } from '@/httpapis/api';
import type { Building } from '@/model/building';

// 单例状态：如果系统中已有数据体就使用该数据体，否则创建新的
let state: {
  isLoading: ReturnType<typeof ref<boolean>>;
  data: ReturnType<typeof ref<Building[]>>;
} | null = null;

export const useBuildingData = () => {
  // 如果系统中已有数据体，直接返回；否则创建新的数据体
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Building[]>([]),
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
      title: '建筑名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
    },
  ];

  const list = async () => {
    state!.isLoading.value = true;
    try {
      const response = await BuildingApi.list();
      const responseData = response.data.data as Building[];
      state!.data.value = responseData || [];
    } catch (error: any) {
      message.error(`获取列表失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      state!.isLoading.value = false;
    }
  };

  const fetch = async (id: number): Promise<Building> => {
    state!.isLoading.value = true;
    try {
      // 通过列表接口查找
      const response = await BuildingApi.list();
      const responseData = response.data.data as Building[];
      const building = responseData.find((b) => b.id === id);
      if (!building) {
        throw new Error('建筑不存在');
      }
      return building;
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
    remark?: string;
  }) => {
    state!.isLoading.value = true;
    try {
      await BuildingApi.create(data);
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
      ismartid: string;
      name: string;
      remark?: string;
    },
    id: number
  ) => {
    state!.isLoading.value = true;
    try {
      await BuildingApi.update(data, id);
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
      await BuildingApi.remove({ id });
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

