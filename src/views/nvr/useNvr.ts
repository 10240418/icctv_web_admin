import { ref, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import { NvrApi } from '@/httpapis/api'
import type { Nvr, NvrList } from '@/model/nvr'

export type RTSPPathInput = {
  id?: string
  source_id?: number
  channel?: number
  path?: string
  url: string
  remark?: string
  visible?: boolean
}

type NvrState = {
  isLoading: Ref<boolean>
  data: Ref<Nvr[]>
  rawData: Ref<Nvr[]>
  searchKeyword: Ref<string>
}

let state: NvrState | null = null

export const useNvrData = () => {
  if (!state) {
    state = {
      isLoading: ref(false),
      data: ref<Nvr[]>([]),
      rawData: ref<Nvr[]>([]),
      searchKeyword: ref(''),
    }
  }

  const sharedState = state

  const applyFilter = () => {
    const keyword = sharedState.searchKeyword.value.trim().toLowerCase()
    if (!keyword) {
      sharedState.data.value = [...sharedState.rawData.value]
      return
    }
    sharedState.data.value = sharedState.rawData.value.filter((group) => {
      const pathText = (group.rtsp_urls || [])
        .flatMap((item) => [item.path, item.url, item.remark])
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return group.name.toLowerCase().includes(keyword) || pathText.includes(keyword)
    })
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '組名稱', dataIndex: 'name', key: 'name', width: 220 },
    { title: '大厦', key: 'building', width: 180 },
    { title: 'OrangePi', key: 'orangepi', width: 160 },
    { title: 'Path 數量', key: 'path_count', width: 110 },
    { title: 'Paths', key: 'paths', width: 420 },
    { title: '組更新時間（香港）', dataIndex: 'updatedAt', key: 'updatedAt', width: 230 },
    { title: '操作', key: 'action', width: 140 },
  ]

  const list = async () => {
    sharedState.isLoading.value = true
    try {
      const response = await NvrApi.list()
      const responseData = response.data.data as NvrList | Nvr | Nvr[]
      if (Array.isArray(responseData)) {
        sharedState.rawData.value = responseData
      } else if ('items' in responseData) {
        sharedState.rawData.value = responseData.items
      } else {
        sharedState.rawData.value = responseData ? [responseData] : []
      }
      applyFilter()
    } catch (error: any) {
      message.error(`獲取 RTSP 組失敗: ${error.response?.data?.error || error.message}`)
      return Promise.reject(error)
    } finally {
      sharedState.isLoading.value = false
    }
  }

  const fetch = async (id: number): Promise<Nvr> => {
    sharedState.isLoading.value = true
    try {
      const response = await NvrApi.list({ id })
      return response.data.data as Nvr
    } catch (error: any) {
      message.error(`獲取 RTSP 組失敗: ${error.response?.data?.error || error.message}`)
      return Promise.reject(error)
    } finally {
      sharedState.isLoading.value = false
    }
  }

  const create = async (data: { name: string; building_id: number; orangepi_id: number; rtsp_urls: RTSPPathInput[] }) => {
    sharedState.isLoading.value = true
    try {
      await NvrApi.create({
        name: data.name,
        url: '',
        building_id: data.building_id,
        orangepi_id: data.orangepi_id,
        rtsp_urls: data.rtsp_urls,
      })
      message.success('RTSP 組已創建')
      await list()
    } catch (error: any) {
      message.error(`創建失敗: ${error.response?.data?.error || error.message}`)
      await list().catch(() => undefined)
      return Promise.reject(error)
    } finally {
      sharedState.isLoading.value = false
    }
  }

  const update = async (
    data: { name: string; building_id: number; orangepi_id: number; rtsp_urls: RTSPPathInput[] },
    id: number,
  ) => {
    sharedState.isLoading.value = true
    try {
      await NvrApi.update({
        ...data,
        binding: { building_id: data.building_id, orangepi_id: data.orangepi_id },
      }, id)
      message.success('RTSP 組已更新')
      await list()
    } catch (error: any) {
      message.error(`更新失敗: ${error.response?.data?.error || error.message}`)
      await list().catch(() => undefined)
      return Promise.reject(error)
    } finally {
      sharedState.isLoading.value = false
    }
  }

  const remove = async (id: number) => {
    sharedState.isLoading.value = true
    try {
      await NvrApi.remove({ id })
      message.success('RTSP 組已刪除')
      await list()
    } catch (error: any) {
      message.error(`刪除失敗: ${error.response?.data?.error || error.message}`)
      return Promise.reject(error)
    } finally {
      sharedState.isLoading.value = false
    }
  }

  const search = (keyword: string) => {
    sharedState.searchKeyword.value = keyword
    applyFilter()
  }

  return {
    isLoading: sharedState.isLoading,
    data: sharedState.data,
    rawData: sharedState.rawData,
    searchKeyword: sharedState.searchKeyword,
    columns,
    list,
    search,
    fetch,
    create,
    update,
    remove,
  }
}
