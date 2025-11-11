// 高德地图服务
import { api } from '../services/index.js';

export class MapService {
  constructor() {
    this.map = null;
    this.AMap = null;
    this.markers = [];
    this.routes = [];
    this.initMap();
  }

  async initMap() {
    try {
      // 通过CDN加载高德地图API
      if (typeof window !== 'undefined' && window.AMap) {
        this.AMap = window.AMap;
        return;
      }

      // 动态加载高德地图脚本
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_KEY || 'your-amap-key'}`;
      script.onload = () => {
        this.AMap = window.AMap;
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('高德地图加载失败:', error);
    }
  }

  // 创建地图实例
  createMap(container, options = {}) {
    if (!this.AMap) {
      console.error('高德地图未初始化');
      return null;
    }

    const defaultOptions = {
      zoom: 12,
      center: [116.397428, 39.90923], // 北京
      mapStyle: 'amap://styles/normal',
      ...options
    };

    this.map = new this.AMap.Map(container, defaultOptions);
    return this.map;
  }

  // 添加标记点
  addMarker(position, options = {}) {
    if (!this.map || !this.AMap) return null;

    const marker = new this.AMap.Marker({
      position,
      ...options
    });

    marker.setMap(this.map);
    this.markers.push(marker);
    return marker;
  }

  // 添加信息窗口
  addInfoWindow(marker, content) {
    if (!this.map || !this.AMap) return null;

    const infoWindow = new this.AMap.InfoWindow({
      content,
      offset: new this.AMap.Pixel(0, -30)
    });

    marker.on('click', () => {
      infoWindow.open(this.map, marker.getPosition());
    });

    return infoWindow;
  }

  // 规划路线
  planRoute(origin, destination, type = 'driving') {
    if (!this.map || !this.AMap) return null;

    const routeOptions = {
      map: this.map,
      policy: this.AMap.DrivingPolicy.LEAST_TIME
    };

    let route;
    switch (type) {
      case 'driving':
        route = new this.AMap.Driving(routeOptions);
        break;
      case 'walking':
        route = new this.AMap.Walking(routeOptions);
        break;
      case 'transit':
        route = new this.AMap.Transfer(routeOptions);
        break;
    }

    route.search(origin, destination, (status, result) => {
      if (status === 'complete') {
        console.log('路线规划成功');
      } else {
        console.error('路线规划失败:', result);
      }
    });

    this.routes.push(route);
    return route;
  }

  // 清除所有标记
  clearMarkers() {
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    this.markers = [];
  }

  // 清除所有路线
  clearRoutes() {
    this.routes.forEach(route => {
      route.clear();
    });
    this.routes = [];
  }

  // 获取地图实例
  getMap() {
    return this.map;
  }

  // 设置地图中心
  setCenter(position) {
    if (this.map) {
      this.map.setCenter(position);
    }
  }

  // 设置地图缩放级别
  setZoom(zoom) {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  // 使用后端API获取位置信息
  async getLocationInfo(location) {
    try {
      const response = await api.get('/map/location/info', {
        params: {
          location: Array.isArray(location) ? location.join(',') : location
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取位置信息失败:', error);
      // 失败时返回空对象
      return {};
    }
  }

  // 使用后端API搜索地点
  async searchPlaces(keyword, city = '全国') {
    try {
      const response = await api.get('/map/places/search', {
        params: {
          keyword,
          city
        }
      });
      return response.data.places || [];
    } catch (error) {
      console.error('搜索地点失败:', error);
      // 失败时返回空数组
      return [];
    }
  }
}

// 创建全局实例
export const mapService = new MapService();