import { ref, type Ref } from 'vue';
import { message } from 'ant-design-vue';
import { AdminApi } from '@/httpapis/api';
import type { Admin, AdminList } from '@/model/admin';

// 單例狀態：如果系統中已有數據體就使用該數據體，否則創建新的
type AdminState = {
  isLoading: Ref<boolean>;
  data: Ref<Admin[]>;
  pagination: Ref<{ currentPage: number; pageSize: number; total: number }>;
  searchKeyword: Ref<string>;
};

let state: AdminState | null = null;

export const useAdminData = () => {
  // 如果系統中已有數據體，直接返回；否則創建新的數據體
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Admin[]>([]),
      pagination: ref({
        currentPage: 1,
        pageSize: 20,
        total: 0,
      }),
      searchKeyword: ref(''),
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
      title: '用戶名',
      dataIndex: 'username',
      key: 'username',
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

  const list = async (keyword?: string) => {
    sharedState.isLoading.value = true;
    if (keyword !== undefined) {
      sharedState.pagination.value.currentPage = 1;
      sharedState.searchKeyword.value = keyword;
    }
    const currentKeyword = sharedState.searchKeyword.value.trim();
    try {
      const response = await AdminApi.list({
        pageNum: sharedState.pagination.value.currentPage,
        pageSize: sharedState.pagination.value.pageSize,
        username: currentKeyword || undefined,
      });
      const responseData = response.data.data as AdminList | Admin;
      if ('items' in responseData) {
        sharedState.data.value = responseData.items;
        sharedState.pagination.value.total = responseData.page.total;
      } else {
        // 如果返回的是單個對象（按ID查詢）
        const singleData = responseData as Admin;
        sharedState.data.value = singleData ? [singleData] : [];
        sharedState.pagination.value.total = 1;
      }
    } catch (error: any) {
      message.error(`獲取列表失敗: ${error.response?.data?.error || error.message}`);
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
      message.error(`獲取詳情失敗: ${error.response?.data?.error || error.message}`);
      return Promise.reject(error);
    } finally {
      sharedState.isLoading.value = false;
    }
  };

  const create = async (data: { username: string; password: string }) => {
    sharedState.isLoading.value = true;
    try {
      await AdminApi.create(data);
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

  const update = async (data: { id: number; username?: string; password?: string }) => {
    sharedState.isLoading.value = true;
    try {
      await AdminApi.update(data);
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
      await AdminApi.remove({ id });
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

  return {
    isLoading: sharedState.isLoading,
    data: sharedState.data,
    pagination: sharedState.pagination,
    searchKeyword: sharedState.searchKeyword,
    columns,
    list,
    search: list,
    fetch,
    create,
    update,
    remove,
  };
};

