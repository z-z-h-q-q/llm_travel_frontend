// 高德地图服务
export class MapService {
  private map: any = null
  private AMap: any = null
  private markers: any[] = []
  private routes: any[] = []

  constructor() {
    this.initMap()
  }

  private async initMap() {
    try {
      // 通过CDN加载高德地图API
      if (typeof window !== 'undefined' && (window as any).AMap) {
        this.AMap = (window as any).AMap
        return
      }

      // 动态加载高德地图脚本
      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_KEY || 'your-amap-key'}`
      script.onload = () => {
        this.AMap = (window as any).AMap
      }
      document.head.appendChild(script)
    } catch (error) {
      console.error('高德地图加载失败:', error)
    }
  }

  // 创建地图实例
  createMap(container: string | HTMLElement, options: any = {}) {
    if (!this.AMap) {
      console.error('高德地图未初始化')
      return null
    }

    const defaultOptions = {
      zoom: 12,
      center: [116.397428, 39.90923], // 北京
      mapStyle: 'amap://styles/normal',
      ...options
    }

    this.map = new this.AMap.Map(container, defaultOptions)
    return this.map
  }

  // 添加标记点
  addMarker(position: [number, number], options: any = {}) {
    if (!this.map || !this.AMap) return null

    const marker = new this.AMap.Marker({
      position,
      ...options
    })

    marker.setMap(this.map)
    this.markers.push(marker)
    return marker
  }

  // 添加信息窗口
  addInfoWindow(marker: any, content: string) {
    if (!this.map || !this.AMap) return null

    const infoWindow = new this.AMap.InfoWindow({
      content,
      offset: new this.AMap.Pixel(0, -30)
    })

    marker.on('click', () => {
      infoWindow.open(this.map, marker.getPosition())
    })

    return infoWindow
  }

  // 规划路线
  planRoute(origin: [number, number], destination: [number, number], type: 'driving' | 'walking' | 'transit' = 'driving') {
    if (!this.map || !this.AMap) return null

    const routeOptions = {
      map: this.map,
      policy: this.AMap.DrivingPolicy.LEAST_TIME
    }

    let route: any
    switch (type) {
      case 'driving':
        route = new this.AMap.Driving(routeOptions)
        break
      case 'walking':
        route = new this.AMap.Walking(routeOptions)
        break
      case 'transit':
        route = new this.AMap.Transfer(routeOptions)
        break
    }

    route.search(origin, destination, (status: string, result: any) => {
      if (status === 'complete') {
        console.log('路线规划成功')
      } else {
        console.error('路线规划失败:', result)
      }
    })

    this.routes.push(route)
    return route
  }

  // 清除所有标记
  clearMarkers() {
    this.markers.forEach(marker => {
      marker.setMap(null)
    })
    this.markers = []
  }

  // 清除所有路线
  clearRoutes() {
    this.routes.forEach(route => {
      route.clear()
    })
    this.routes = []
  }

  // 获取地图实例
  getMap() {
    return this.map
  }

  // 设置地图中心
  setCenter(position: [number, number]) {
    if (this.map) {
      this.map.setCenter(position)
    }
  }

  // 设置地图缩放级别
  setZoom(zoom: number) {
    if (this.map) {
      this.map.setZoom(zoom)
    }
  }
}

// 创建全局实例
export const mapService = new MapService()
