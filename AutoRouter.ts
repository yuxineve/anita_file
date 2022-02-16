import { Router } from 'egg';
import { FULLPATH } from 'egg-core/lib/loader/file_loader';

const FILE_UPLOAD = Symbol('fileUpload');
const FILE_EXPORT = Symbol('fileExport');
const NONE = Symbol('none');
const routerRegister = {};

export const base = (path: string) => {
    return (constructor: any) => {
        (constructor._methods || []).forEach((value: any) => {
            value.path = (path + '/' + value.path).replace(/\/{2,}/g, '/');
        });
    };
};

function makeDecorator(methodName: string, tags = NONE) {
    return function decorators(path: string, enable = true) {
        return (target: any, propertyKey: string) => {
            if (!enable) return target;
            const endPath = target.constructor.name + '.' + propertyKey + '()';
            if (!Array.isArray(target.constructor._methods)) {
                target.constructor._methods = [];
            }
            target.constructor._methods.push(routerRegister[endPath] = { methodName, path, tags });
            return target;
        };
    };
}
export const post = makeDecorator('post');
export const file = makeDecorator('post', FILE_UPLOAD);
export const fileExports = makeDecorator('get', FILE_EXPORT);
export const get = makeDecorator('get');

export const useDecorators = function (router: Router,
    controllers: any,
    clientPath: string,
    axiosImportPath: string,
    basePath: string) {
    const routers = {};
    Object.keys(controllers).forEach(controllerName => {
        const controller = controllers[controllerName];
        routers[controllerName] = [];
        Object.keys(controller).forEach(controllerMethod => {
            const method = controller[controllerMethod];
            const fullPath = method[FULLPATH];
            if (fullPath) {
                const methodPath = (fullPath.split('#') || [])[1];
                if (methodPath && routerRegister[methodPath]) {
                    const { methodName, path, tags } = routerRegister[methodPath];
                    routers[controllerName].push({
                        controllerMethod,
                        methodName,
                        path,
                        tags,
                    });
                    router[methodName](path, method);
                }
            }
        });
    });

    if (process.env.DOCKER_ENV === 'local') {
        generateService(routers, clientPath, axiosImportPath, basePath);
    }
};

function generateService(routers: any, clientPath: string, axiosImportPath: string, basePath: string) {
    const fs = require('fs');

    fs.writeFileSync(clientPath, `
/**
 * auto generator
 * don't modify
 */
import axiosClient from '${axiosImportPath}';
import { AxiosRequestConfig, AxiosPromise } from 'axios';

export interface Response {
    code: number;
    msg: string;
    data: any;
}

const Services = {
    ${Object.keys(routers).map(controller => {
        return `${controller}: {
        ${routers[controller].map(v => {
            const isFile = v.tags === FILE_UPLOAD;
            const isExport = v.tags === FILE_EXPORT;
            const paths = v.path.split(/\//g);
            const preParam = [];
            v.path = paths.map(pathParam => {
                if (pathParam.startsWith(':')) {
                    const pathId = pathParam.replace(/\:/, '');
                    preParam.push(pathId + ': string');
                    return `\${${pathId}}`;
                }
                return pathParam;
            }).join('/');
            const params = preParam.join(', '); let paramKey = 'data';
            if (v.methodName.toUpperCase() === 'GET') {
                paramKey = 'params';
            }
            if (isExport) {
                return `${v.controllerMethod}(${
                    params ? params + ', ' : ''
                    }data:any): Promise<string> {
            const url = \`${(basePath + v.path).replace(/\/{2,}/g, '/')}?\`;
            const params = Object.keys(data).map(key => {
                return key + '=' + encodeURIComponent(data[key]);
            }).join('&');
            window.open(url + params,'__blank');
            return Promise.resolve(url);
        },`;
            } else if (isFile) {
                return `${v.controllerMethod}(${
                    params ? params + ', ' : ''
                    }data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            const form = new FormData();
            Object.keys(data).forEach(key => {
                form.append(key, data[key]);
            });
            opt = Object.assign(opt , { url: \`${v.path}\`, method: '${v.methodName}', ${paramKey}: form });
            opt.headers = Object.assign(opt.headers||{}, {
                'Content-Type': 'multipart/form-data',
            });
            return axiosClient(opt);
        },`;
            } else {
                return `${v.controllerMethod}(${
                    params ? params + ', ' : ''
                    }data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: \`${v.path}\`, method: '${v.methodName}', ${paramKey}: data });
            return axiosClient(opt);
        },`;
            }
        }).join('\n\t\t')}
    },`;
    }).join('\n\t')}
};

export default Services;

`);
}
