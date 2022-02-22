
/**
 * auto generator
 * don't modify
 */
import axiosClient from './axios';
import { AxiosRequestConfig, AxiosPromise } from 'axios';

export interface Response {
    code: number;
    msg: string;
    data: any;
}

const Services = {
    courseManagement: {
        getCourseIntroduction(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getCourseIntroduction`, method: 'post', data: data });
            return axiosClient(opt);
        },
		getCourseDetail(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getCourseDetail`, method: 'post', data: data });
            return axiosClient(opt);
        },
		getCourseList(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getCourseList`, method: 'post', data: data });
            return axiosClient(opt);
        },
		createOrEditCourseDetail(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/createOrEditCourseDetail`, method: 'post', data: data });
            return axiosClient(opt);
        },
		createOrEditCourseIntroduction(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/createOrEditCourseIntroduction`, method: 'post', data: data });
            return axiosClient(opt);
        },
		getCourseAuthor(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getCourseAuthor`, method: 'post', data: data });
            return axiosClient(opt);
        },
		createOrEditCourseAuthor(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/createOrEditCourseAuthor`, method: 'post', data: data });
            return axiosClient(opt);
        },
		delCourse(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/delCourse`, method: 'post', data: data });
            return axiosClient(opt);
        },
		addOrRemoveFavoriteCourse(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/addOrRemoveFavoriteCourse`, method: 'post', data: data });
            return axiosClient(opt);
        },
		commitCourseAudit(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/commitCourseAudit`, method: 'post', data: data });
            return axiosClient(opt);
        },
		auditCourse(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/auditCourse`, method: 'post', data: data });
            return axiosClient(opt);
        },
		createCourse(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/createCourse`, method: 'post', data: data });
            return axiosClient(opt);
        },
		createUnit(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/createUnit`, method: 'post', data: data });
            return axiosClient(opt);
        },
		editUnit(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/editUnit`, method: 'post', data: data });
            return axiosClient(opt);
        },
		createClasss(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/createClass`, method: 'post', data: data });
            return axiosClient(opt);
        },
		editClasss(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/editClass`, method: 'post', data: data });
            return axiosClient(opt);
        },
		createTask(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/createTask`, method: 'post', data: data });
            return axiosClient(opt);
        },
		editIVideoTask(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/editIvideoTask`, method: 'post', data: data });
            return axiosClient(opt);
        },
		editTask(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/editTask`, method: 'post', data: data });
            return axiosClient(opt);
        },
		delUnit(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/delUnit`, method: 'post', data: data });
            return axiosClient(opt);
        },
		delLesson(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/delLesson`, method: 'post', data: data });
            return axiosClient(opt);
        },
		delTask(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/delTask`, method: 'post', data: data });
            return axiosClient(opt);
        },
		editTaskOrder(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/editTaskOrder`, method: 'post', data: data });
            return axiosClient(opt);
        },
		editLessonOrder(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/editLessonOrder`, method: 'post', data: data });
            return axiosClient(opt);
        },
		createPuse(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/createPause`, method: 'post', data: data });
            return axiosClient(opt);
        },
		getUnit(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getUnitInfo`, method: 'post', data: data });
            return axiosClient(opt);
        },
		getTasks(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getTasks`, method: 'post', data: data });
            return axiosClient(opt);
        },
    },
	dict: {
        getDictListByType(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getDictListByType`, method: 'post', data: data });
            return axiosClient(opt);
        },
		getDeptList(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getDeptList`, method: 'post', data: data });
            return axiosClient(opt);
        },
		getTeacherList(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/management/getTeacherList`, method: 'post', data: data });
            return axiosClient(opt);
        },
    },
	edu: {
        login(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/edu/login/callback`, method: 'get', params: data });
            return axiosClient(opt);
        },
		CallBackMsgFromJyh(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/edu/info/callback`, method: 'post', data: data });
            return axiosClient(opt);
        },
    },
	home: {
        
    },
	test: {
        sayHi(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/api/hi`, method: 'post', data: data });
            return axiosClient(opt);
        },
    },
	upload: {
        uploadSingleFile(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            const form = new FormData();
            Object.keys(data).forEach(key => {
                form.append(key, data[key]);
            });
            opt = Object.assign(opt , { url: `/upload/single`, method: 'post', data: form });
            opt.headers = Object.assign(opt.headers||{}, {
                'Content-Type': 'multipart/form-data',
            });
            return axiosClient(opt);
        },
		uploadSingleAuthFile(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            const form = new FormData();
            Object.keys(data).forEach(key => {
                form.append(key, data[key]);
            });
            opt = Object.assign(opt , { url: `/upload/singleAuth`, method: 'post', data: form });
            opt.headers = Object.assign(opt.headers||{}, {
                'Content-Type': 'multipart/form-data',
            });
            return axiosClient(opt);
        },
		downloadFile(data:any): Promise<string> {
            const url = `/upload/getFile?`;
            const params = Object.keys(data).map(key => {
                return key + '=' + encodeURIComponent(data[key]);
            }).join('&');
            window.open(url + params,'__blank');
            return Promise.resolve(url);
        },
		getAuth(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/upload/getAuth`, method: 'post', data: data });
            return axiosClient(opt);
        },
		getUEConfig(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/upload/ueinterface`, method: 'get', params: data });
            return axiosClient(opt);
        },
		postUEConfig(data: any, opt: AxiosRequestConfig = {}): AxiosPromise<Response> {
            opt = Object.assign(opt , { url: `/upload/ueinterface`, method: 'post', data: data });
            return axiosClient(opt);
        },
    },
};

export default Services;

