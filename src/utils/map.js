// 高德地图服务
import { api } from '../services/index.js';

export class MapService {
  constructor() {
    this.map = null;
    this.AMap = null;
    // store markers as objects { marker, type }
    this.markers = [];
    // placeholders for preview markers before real coords are known
    this.placeholders = [];
    this.routes = [];
    // 不在构造器中等待初始化，外部可以调用并 await initMap()
    this.initCalled = false;
    // 在浏览器环境中暴露到 window 以便 info window 中的按钮能够调用
    try {
      if (typeof window !== 'undefined') {
        // will be set properly after initMap 或构造
        window.__mapService = this;
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * 初始化高德地图脚本并在加载完成后解析
   * 返回一个 Promise，便于外部 await
   */
  initMap() {
    if (this.initCalled) {
      // 如果已经开始初始化，返回已存在的 promise
      return this._initPromise || Promise.resolve();
    }
    this.initCalled = true;

    this._initPromise = new Promise((resolve, reject) => {
      try {
        // 如果已经在页面中加载过 AMap，直接返回
        if (typeof window !== 'undefined' && window.AMap) {
          this.AMap = window.AMap;
          resolve();
          return;
        }

        const key = import.meta.env.VITE_AMAP_KEY;
        if (!key) {
          const msg = '缺少 VITE_AMAP_KEY 环境变量，请在 .env 中设置高德地图 Key（VITE_AMAP_KEY=your_key）';
          console.error(msg);
          reject(new Error(msg));
          return;
        }

        // 动态加载高德地图脚本
        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.AMap) {
            this.AMap = window.AMap;
            resolve();
          } else {
            const err = new Error('高德地图脚本加载完成但 window.AMap 未就绪');
            console.error(err);
            reject(err);
          }
        };
        script.onerror = (e) => {
          const err = new Error('高德地图脚本加载失败（可能是无效的 key 或网络错误）');
          console.error('高德地图加载失败:', e);
          reject(err);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('高德地图加载异常:', error);
        reject(error);
      }
    });

    return this._initPromise;
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
      // 通过 features 控制要展示的图层，移除 'point' 可隐藏内置 POI/名称/标注
      // 可选值例如: 'bg','road','building','point','label','manmade','green','subway'
      // 这里默认不包含 'point'，以避免显示大量 POI 名称文字
      mapStyle: 'amap://styles/normal',
      features: ['bg', 'road', 'building'],
      ...options
    };

    this.map = new this.AMap.Map(container, defaultOptions);
    // 兼容性回退：有些版本或场景下 constructor 的 features 可能未生效，显式调用 setFeatures
    try {
      if (typeof this.map.setFeatures === 'function') {
        this.map.setFeatures(defaultOptions.features || ['bg', 'road', 'building']);
      }
    } catch (e) {
      // 忽略错误，继续工作
    }
    return this.map;
  }

  // 添加标记点
  addMarker(position, options = {}) {
    if (!this.map || !this.AMap) return null;

    // 支持基于类型的简单视觉区分（使用 Emoji 作为 label）
    const type = options.type || 'default';
    let labelEmoji = '';
    switch (type) {
      case 'hotel':
        labelEmoji = '🏨';
        break;
      case 'restaurant':
        labelEmoji = '🍽️';
        break;
      case 'attraction':
        labelEmoji = '📍';
        break;
      default:
        labelEmoji = '';
    }

    // 位置可能为 [lng, lat] 数组或 AMap.LngLat 对象
    let posOption = position;
    try {
      if (Array.isArray(position) && position.length === 2) {
        posOption = new this.AMap.LngLat(position[0], position[1]);
      }
    } catch (e) {
      console.warn('构建 LngLat 失败，使用原始 position：', e);
    }

    const markerOptions = {
      position: posOption
    };

    // 只有在显式要求时才设置 title 或 label，避免默认在地图上显示文字或名称
    if (options.title && options.showTitle) {
      markerOptions.title = options.title;
    }

    // 如果提供自定义 content（HTML 字符串）则优先使用
    if (options.content) {
      markerOptions.content = options.content;
    } else if (labelEmoji && options.showLabel) {
      // 只有在显式要求 showLabel 时才显示 emoji label
      markerOptions.label = {
        content: `<div style="font-size:18px;line-height:18px">${labelEmoji}</div>`,
        offset: new this.AMap.Pixel(-9, -9)
      };
    }

    const marker = new this.AMap.Marker(markerOptions);
    // 仅当显式要求显示时才挂载到地图（外部可通过 setMap 显示）
    if (options.show === undefined || options.show) {
      // 默认为显示；如果想要创建但不显示，可传入 { show: false }
      marker.setMap(this.map);
    }
  this.markers.push({ marker, type });
    // 输出调试信息，便于排查标记未显示的问题
    try {
      console.debug('addMarker', { type, title: options.title, position: posOption });
    } catch (e) {
      // ignore
    }
    return marker;
  }

  // 添加一个占位（预览）标记，用于在真实坐标解析完成前展示预览样式
  addPlaceholderMarker(position, options = {}) {
    if (!this.map || !this.AMap) return null;
    const type = options.type || 'default';
    const title = options.title || '';
    // 使用半透明卡片样式
    const html = `<div style="background: rgba(255,255,255,0.9);padding:6px 10px;border-radius:6px;border:1px dashed #ccc;box-shadow:0 2px 6px rgba(0,0,0,0.08);font-size:12px;color:#333;opacity:0.85;">${title}</div>`;
    let posOption = position;
    try {
      if (Array.isArray(position) && position.length === 2) {
        posOption = new this.AMap.LngLat(position[0], position[1]);
      }
    } catch (e) {
      // ignore
    }

    const markerOptions = {
      position: posOption,
      content: html,
      offset: new this.AMap.Pixel(-10, -30)
    };

    const marker = new this.AMap.Marker(markerOptions);
    // 占位默认不自动显示，除非传入 showPlaceholder: true
    if (options.showPlaceholder) {
      marker.setMap(this.map);
    }
    const key = options.key || (`ph_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
    this.placeholders.push({ key, marker, type });
    return { key, marker };
  }

  // 用真实坐标替换占位标记：删除占位并添加真实标记
  replacePlaceholderWithMarker(key, position, options = {}) {
    if (!this.map || !this.AMap) return null;
    const idx = this.placeholders.findIndex(p => p.key === key);
    if (idx !== -1) {
      try { this.placeholders[idx].marker.setMap(null) } catch (e) {}
      this.placeholders.splice(idx, 1);
    }
    // 添加真实标记
    return this.addMarker(position, options);
  }

  // 清除所有占位标记
  clearPlaceholders() {
    this.placeholders.forEach(p => {
      try { p.marker.setMap(null) } catch (e) {}
    });
    this.placeholders = [];
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

  // 增强版：在信息窗中加入动作按钮（查看详情/导航）
  addInfoWindowWithActions(marker, content, data = {}) {
    if (!this.map || !this.AMap) return null;

    // 为安全性，将 data 编码后作为字符串传入 onclick
    let encoded = '';
    try {
      encoded = encodeURIComponent(JSON.stringify(data));
    } catch (e) {
      encoded = '';
    }
    // 只保留“查看详情”按钮，点击将打开高德地图的 marker 页面（新标签）
    // 尝试从 data 中解析坐标与名称用于构造跳转链接
    let pos = null;
    let name = '';
    try {
      const payload = data || {};
      if (Array.isArray(payload.pos) && payload.pos.length === 2) pos = payload.pos;
      const item = payload.item || payload;
      if (!pos && item) {
        if (item.location && typeof item.location.longitude === 'number' && typeof item.location.latitude === 'number') pos = [item.location.longitude, item.location.latitude];
        else if (item.lng && item.lat) pos = [parseFloat(item.lng), parseFloat(item.lat)];
      }
      name = (item && (item.name || item.title)) || '';
    } catch (e) {
      // ignore
    }

    // 构造按钮：如果有坐标则跳转到高德 marker uri，否则打开高德搜索页面
    let detailsOnclick = '';
    try {
      if (pos && pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1])) {
        const url = `https://uri.amap.com/marker?position=${pos[0]},${pos[1]}&name=${encodeURIComponent(name || '')}&callnative=0`;
        detailsOnclick = `window.open('${url}','_blank')`;
      } else if (name) {
        const url = `https://www.amap.com/search?query=${encodeURIComponent(name)}`;
        detailsOnclick = `window.open('${url}','_blank')`;
      } else {
        // 兜底打开高德首页
        detailsOnclick = `window.open('https://www.amap.com','_blank')`;
      }
    } catch (e) {
      detailsOnclick = `window.open('https://www.amap.com','_blank')`;
    }

    const actionsHtml = `\n      <div style="margin-top:8px;text-align:right">\n        <button style="padding:6px 8px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;" onclick="${detailsOnclick}">查看详情</button>\n      </div>`;

    const fullContent = `${content}${actionsHtml}`;

    const infoWindow = new this.AMap.InfoWindow({
      content: fullContent,
      offset: new this.AMap.Pixel(0, -30)
    });

    marker.on('click', () => {
      infoWindow.open(this.map, marker.getPosition());
    });

    return infoWindow;
  }

  // 被 info window 的按钮调用：action = 'navigate' | 'details', payload 是 encodeURIComponent(JSON.stringify(data))
  _onInfoAction(action, payloadEncoded) {
    let payload = null;
    try {
      if (payloadEncoded) payload = JSON.parse(decodeURIComponent(payloadEncoded));
    } catch (e) {
      payload = null;
    }

    if (action === 'navigate') {
      // payload 期望包含 pos: [lng, lat]
      const pos = payload?.pos || (payload?.item && (payload.item.location ? [payload.item.location.longitude, payload.item.location.latitude] : null))
      if (!pos) {
        console.warn('导航失败：缺少目标坐标', payload)
        return
      }
      try {
        // origin 使用地图当前中心
        const origin = this.map.getCenter();
        const dest = new this.AMap.LngLat(pos[0], pos[1]);
        // 使用驾车路径规划
        this.planRoute(origin, dest, 'driving');
      } catch (e) {
        console.error('导航调用失败', e);
        // 兜底：绘制直线
        try { this.drawRoute([this.map.getCenter().toArray(), pos]) } catch (err) {}
      }
    } else if (action === 'details') {
      // 派发事件，供页面捕获并打开详情弹窗
      try {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('map:item:details', { detail: payload?.item || payload });
          window.dispatchEvent(event);
        }
      } catch (e) {
        console.warn('触发详情事件失败', e);
      }
    }
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

  // 绘制折线连接一系列坐标点（不调用驾车/步行服务），用于快速显示顺序路径
  addPolyline(points = [], options = {}) {
    if (!this.map || !this.AMap) return null;
    if (!Array.isArray(points) || points.length < 2) return null;

    // 确保 path 使用 AMap.LngLat 或经纬数组
    const path = points.map(p => {
      if (Array.isArray(p) && p.length === 2) return new this.AMap.LngLat(p[0], p[1]);
      return p;
    });

    const polyline = new this.AMap.Polyline({
      path,
      strokeColor: options.strokeColor || '#3388ff',
      strokeWeight: options.strokeWeight || 4,
      strokeOpacity: options.strokeOpacity || 0.8,
      strokeStyle: options.strokeStyle || 'solid'
    });

    polyline.setMap(this.map);
    this.routes.push(polyline);
    return polyline;
  }

  // 清除所有路线并绘制新的折线（便捷方法）
  drawRoute(points = [], options = {}) {
    // 清除旧路线但保留标记
    this.clearRoutes();
    return this.addPolyline(points, options);
  }

  // 根据当前标记适配视野
  fitToMarkers() {
    if (!this.map || !this.AMap) return;
    try {
      if (this.markers.length === 0) return;
      const markerInstances = this.markers.map(m => m.marker);
      this.map.setFitView(markerInstances);
    } catch (e) {
      console.warn('fitToMarkers failed', e);
    }
  }

  // 清除所有标记
  clearMarkers() {
    this.markers.forEach(({ marker }) => {
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

  // 返回指定类型的 marker 实例数组（不改变显示）
  getMarkersByType(types = []) {
    if (!Array.isArray(types) || types.length === 0) return this.markers.map(m => m.marker);
    return this.markers.filter(m => types.includes(m.type)).map(m => m.marker);
  }

  // 根据类型显示/隐藏标记
  showMarkersByType(types = []) {
    if (!this.map) return;
    // if empty types => show all
    if (!Array.isArray(types) || types.length === 0) {
      this.markers.forEach(({ marker }) => marker.setMap(this.map));
      return;
    }
    this.markers.forEach(({ marker, type }) => {
      if (types.includes(type)) {
        marker.setMap(this.map);
      } else {
        marker.setMap(null);
      }
    });
  }

  // 缩放并居中到指定位置（[lng, lat] 或 AMap.LngLat）
  zoomToPosition(position, zoom = 15) {
    if (!this.map || !this.AMap || !position) return;
    let pos = position;
    try {
      if (Array.isArray(position) && position.length === 2) pos = new this.AMap.LngLat(position[0], position[1]);
    } catch (e) {
      // ignore
    }
    try {
      this.map.setCenter(pos);
      this.map.setZoom(zoom);
    } catch (e) {
      console.warn('zoomToPosition failed', e);
    }
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
      // Amap 返回的字段通常是 `pois`, 也保留对 `places` 的兼容
      return response.data.pois || response.data.places || [];
    } catch (error) {
      console.error('搜索地点失败:', error);
      // 失败时返回空数组
      return [];
    }
  }
}

// 创建全局实例
export const mapService = new MapService();