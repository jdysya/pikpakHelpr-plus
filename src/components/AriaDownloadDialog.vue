<template>
  <div style="width: 60%" v-if="show" class="dialog">
    <h2>请勾选你要下载的</h2>
    <div class="close" @click="close">×</div>
    <input @change="onCheckAll" style="margin: 10px 10px 0 0" type="checkbox" id="checkbox" v-model="checkedAll">全选
    <ul class="movies">
      <li v-for="(item, index) in list" :key="item.id"><input @change="onCheck" type="checkbox" :id="item.id"
          :value="index" v-model="selected">{{ item.name }}</li>
    </ul>
    <div class="footer">
      <div class="btn el-button el-button--primary" @click="pushBefore">推送到aria2</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getDownload, pushToAria, getList } from '../api'

const props = defineProps({
  show: Boolean
})
const emits = defineEmits(['update:show', 'msg'])

const list = ref([])
const selected = ref([])
const checkedAll = ref(false)
const selectedItems = ref([]) // 选中的项目
const isForbidden = ref(false) // 按钮是否禁用，防抖

watch(
  () => props.show,
  (val) => {
    if (val) {
      const tempList = []
      let parent_id = window.location.href.split('/').pop()
      if (parent_id == 'all') parent_id = ''
      emits('msg', '开始加载文件列表，请稍等')
      getList(parent_id).then(res => {
        res.files.forEach(item => {
          tempList.push({ id: item.id, name: item.name, type: item.kind })
        })
        list.value = tempList
      })
    }
  }
)


const close = () => {
  selected.value = []
  checkedAll.value = false
  isForbidden.value = false
  emits('update:show', false)
}

// 选择
const onCheckAll = () => {
  if (checkedAll.value) {
    selected.value = list.value.map((item, index) => index)
  } else {
    selected.value = []
  }
}
const onCheck = () => {
  checkedAll.value = selected.value.length === list.value.length
}


const getAllList = async () => {
  let count = 0;
  emits('msg', '开始获取文件内容')

  selectedItems.value = [] // 清除缓存

  for (let index of selected.value) {
    selectedItems.value.push(list.value[index])
  }

  for (let item of selectedItems.value) {
    if (item.type == 'drive#folder') {
      let filesList = await getList(item.id)
      emits('msg', `已获取到${++count}个文件`)

      filesList.files.forEach(fileItem => selectedItems.value.push({ id: fileItem.id, name: fileItem.name, type: fileItem.kind, path: (item.path || '') + '/' + item.name }))
    }
  }
  selectedItems.value = selectedItems.value.filter(item => item.type == 'drive#file')
}

const pushBefore = async () => {
  if (!isForbidden.value) {
    isForbidden.value = true
    await getAllList()
    push()
  } else {
    emits('msg', '已经开始推送了')
  }

}


const push = async () => {
  let total = selectedItems.value.length
  let success = 0
  let fail = 0
  let ariaHost = window.localStorage.getItem('ariaHost') || ''
  let ariaPath = window.localStorage.getItem('ariaPath') || ''
  let ariaToken = window.localStorage.getItem('ariaToken') || ''
  let ariaParams = window.localStorage.getItem('ariaParams') || ''
  let errorMSG = ''
  let retryList = [] // 重试列表
  if (!ariaHost) {
    emits('msg', '请先配置aria2')
    close()
    return
  }
  console.log(`共${selectedItems.value.length}个项目`);
  let testIndex = 0
  for (let item of selectedItems.value) {
    getDownload(item.id).then((res) => {

      if (res.error_description) {
        emits('msg', `失败原因: ${res.error_description} 请刷新！`)
        return
      }
      emits('msg', `第${testIndex + 1}个项目下载链接获取成功`)
      console.log(`第${testIndex + 1}个项目下载链接获取成功`);
      let ariaData = {
        id: new Date().getTime(),
        jsonrpc: '2.0',
        method: 'aria2.addUri',
        params: [
          [res.web_content_link],
          { out: res.name }
        ]
      }
      if (ariaPath) {
        // 拼接路径
        ariaData.params[1].dir = ariaPath + (item.path || '')
      }
      if (ariaParams) {
        const customParams = ariaParams.split(';')
        customParams.forEach(item => {
          const customParam = item.split('=')
          ariaData.params[1][customParam[0]] = customParam[1]
        })
      }
      ariaToken && (ariaData.params.unshift(`token:${ariaToken}`))
      pushToAria(ariaHost, ariaData).then((ariares) => {
        if (ariares.result) {
          success++
        } else {
          console.log(ariares);
          console.log(ariaData);
          errorMSG = ariares.error.message === 'Unauthorized' ? '密钥不对' : '推送失败'
          fail++
        }
      }).catch((e) => {
        console.log(ariares);
        console.log(ariaData);
        errorMSG = `${e.statusText} 请检测配置`
        emits('msg', `失败原因: ${e.statusText}`)
        fail++
      }).finally(() => {
        total--
        if (total === 0) {
          emits('msg', `成功：${success} 失败: ${fail} ${fail !== 0 ? '失败原因' + errorMSG : ''}`)
          console.info(`成功：${success} 失败: ${fail} ${fail !== 0 ? '失败原因' + errorMSG : ''}`);
          if (retryList.length > 0) {
            console.log(retryList);
            emits('msg', `即将重试${retryList.length}个项目`)
            console.log(`即将重试${retryList.length}个项目`)
            selectedItems.value = retryList
            retryList = [] // 清空重试列表
            push()
          } else {
            close()
          }
        }
      })
    }).catch((e) => {
      console.warn(`第${testIndex + 1}个项目下载链接获取失败`);
      retryList.push(selectedItems.value[testIndex])
      fail++
      total--
    })
      .finally(() => {
        testIndex++
      })
  }
}
</script>

<style scoped>
.dialog {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, 0%);
  background: #fff;
  z-index: 10000;
  padding: 30px;
  box-shadow: 0 0 50px rgba(0, 0, 0, 1);
  border-radius: 8px;
}

.dialog .close {
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 30px;
  cursor: pointer;
  color: #999;
}

.movies {
  margin-top: 10px;
  height: 450px;
  overflow: auto;
}

.movies li {
  margin-top: 10px;
}

.movies li input {
  margin-right: 10px;
}

.footer {
  margin-top: 20px;
  display: flex;
  flex-direction: row-reverse;
}
</style>
