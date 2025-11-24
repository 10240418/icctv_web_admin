import { ref, type Ref } from 'vue';
import { message } from 'ant-design-vue';
import { AdminApi } from '@/httpapis/api';
import type { Admin, AdminList } from '@/model/admin';

// 单例状态：如果系统中已有数据体就使用该数据体，否则创建新的
type AdminState = {
  isLoading: Ref<boolean>;
  data: Ref<Admin[]>;
  pagination: Ref<{ currentPage: number; pageSize: number; total: number }>;
};

let state: AdminState | null = null;

export const useAdminData = () => {
  // 如果系统中已有数据体，直接返回；否则创建新的数据体
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Admin[]>([]),
      pagination: ref({
        currentPage: 1,
        pageSize: 20,
        total: 0,
      }),
    };
  }

  const sharedState = state as AdminState;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
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
    sharedState.isLoading.value = true;
    try {
      const response = await AdminApi.list({
        pageNum: sharedState.pagination.value.currentPage,
        pageSize: sharedState.pagination.value.pageSize,
      });
      const responseData = response.data.data as AdminList | Admin;
      if ('items' in responseData) {
        sharedState.data.value = responseData.items;
        sharedState.pagination.value.total = responseData.page.total;
      } else {
        // 如果返回的是单个对象（按ID查询）
        const singleData = responseData as Admin;
        sharedState.data.value = singleData ? [singleData] : [];
        sharedState.pagination.value.total = 1;
      }
    } catch (error: any) {
      message.error(`获取列表失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const fetch = async (id: number): Promise<Admin> => {
    sharedState.isLoading.value = true;
    try {
      const response = await AdminApi.list({ id });
      const responseData = response.data.data as Admin;
      return responseData;
    } catch (error: any) {
      message.error(`获取详情失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const create = async (data: { username: string; password: string }) => {
    sharedState.isLoading.value = true;
    try {
      await AdminApi.create(data);
      message.success('创建成功');
      // 创建成功后，调用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const update = async (data: { id: number; username?: string; password?: string }) => {
    sharedState.isLoading.value = true;
    try {
      await AdminApi.update(data);
      message.success('更新成功');
      // 更新成功后，调用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`更新失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const remove = async (id: number) => {
    sharedState.isLoading.value = true;
    try {
      await AdminApi.remove({ id });
      message.success('删除成功');
      // 删除成功后，调用 list() 刷新共享的 data
      await list();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  return {
    isLoading: sharedState.isLoading,
    data: sharedState.data,
    pagination: sharedState.pagination,
    columns,
    list,
    fetch,
    create,
    update,
    remove,
  };
};

