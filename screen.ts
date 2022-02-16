/** @format */

import { Service } from 'egg';
import { rq, LogicError, errorCaptured, ValidatePermission, ResourceName, Operation } from '../util';
import { createCompZip, readDirAndZip } from '../util/zipOp';
import * as fs from 'fs';
import * as JsZip from 'jszip';
import * as path from 'path';
import { changeBodyStyle, parseIndexHtml, shouldChangeBodyStyle } from '../controller/home';
import { getInstructions, toArrayBuffer } from '../util/function';

export default class Screen extends Service {
  public async findScreenCombined(uuid?: string) {
    const { ctx } = this;
    const { combinationScreenId } = ctx.request.body;
    const body = {
      combinationScreenId: uuid || combinationScreenId,
      createdBy: ctx.session.userID,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/combination/screen/findScreen`,
        body: body,
      }),
    );
    if (error || !result) {
      ctx.body = LogicError.FromError({
        code: -1,
        msg: error,
        chmsg: error,
      });
      return;
    }
    const code = result.response.encryptCode;
    result.response.passwordChange = 0;
    if (
      ctx.session[`${result.response.combinationScreenId}-code`] &&
      code !== ctx.session[`${result.response.combinationScreenId}-code`]
    ) {
      result.response.passwordChange = 1;
    }
    result.response.encryptCode = '';
    ctx.body = LogicError.FromOK({
      data: result.response,
    });
    return result.response;
  }

  public async updateCombined() {
    const { ctx } = this;
    const { combinationScreenId, name, config, isDelete = 0, screenItems } = ctx.request.body;
    const body = {
      combinationScreenId,
      createdBy: ctx.session.userID,
      name,
      config,
      screenItems,
      isDelete,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/combination/screen/update`,
        body: body,
      }),
    );
    if (error || !result) {
      ctx.body = LogicError.FromError({
        code: -1,
        msg: error,
        chmsg: error,
      });
      return;
    }
    if (result.retCode) {
      ctx.body = LogicError.FromError({
        code: result.retCode,
        msg: result.retMsg,
        chmsg: result.retMsg,
      });
      return;
    }
    ctx.body = LogicError.FromOK(this.config.errors.OK);
  }

  public async updateNameCombined() {
    const { ctx } = this;
    const { combinationScreenId, name } = ctx.request.body;
    const screen = await this.findScreenCombined(combinationScreenId);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    const body = {
      ...screen,
      combinationScreenId,
      name,
      createdBy: ctx.session.userID,
    };

    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/combination/screen/update`,
        body: body,
      }),
    );

    if (error || result.retCode) {
      ctx.body = LogicError.FromError({
        code: result.retCode,
        msg: result.retMsg,
        chmsg: result.retMsg,
      });
      return;
    }
    ctx.body = LogicError.FromError(this.config.errors.OK);
  }

  public async queryCombined() {
    const { ctx } = this;
    const { pageSize, pageNo, sortBy, orderBy, name, isDelete } = ctx.request.body;
    const body = {
      pageNo,
      pageSize,
      sortBy,
      orderBy,
      name,
      isDelete,
      createdBy: ctx.session.userID,
      role: ctx.session.userRole,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/combination/screen/list`,
        body: body,
      }),
    );
    if (error || !result || result.retCode) {
      ctx.body = LogicError.FromError({
        code: result.retCode,
        msg: result.retMsg,
        chmsg: result.retMsg,
      });
      return;
    }

    const { count, data } = result.response;
    ctx.body = LogicError.FromOK({
      data: data,
      count: count,
    });
  }

  public async createCombined() {
    const { ctx } = this;
    const { name, config, screenItems } = ctx.request.body;

    const body = {
      name,
      config,
      createdBy: ctx.session.userID,
      screenItems,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/combination/screen/create`,
        body: body,
      }),
    );
    if (error || !result.response) {
      ctx.body = LogicError.FromError({
        code: -1,
        msg: error,
        chmsg: error,
      });
      return;
    }
    if (result.retCode !== 0) {
      ctx.body = LogicError.FromError({
        code: result.retCode,
        msg: result.retMsg,
        chmsg: result.retMsg,
      });
      return;
    }
    ctx.body = LogicError.FromOK(this.config.errors.OK);
  }

  public async deleteCombined(real = false) {
    const { ctx } = this;
    const { combinationScreenId } = ctx.request.body;
    const screen = await this.findScreenCombined(combinationScreenId);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    const body = {
      ...screen,
      isDelete: real ? 2 : 1,
      createdBy: ctx.session.userID,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/combination/screen/update`,
        body: body,
      }),
    );

    if (error || result.retCode) {
      ctx.body = LogicError.FromError({
        code: result.retCode,
        msg: result.retMsg,
        chmsg: result.retMsg,
      });
      return;
    }
    ctx.body = LogicError.FromError(this.config.errors.OK);
  }

  public async create() {
    const { ctx } = this;
    const { name, config, platform = 'PC', eventConfig } = ctx.request.body;
    const body = {
      name,
      config: config,
      isDelete: 0,
      eventConfig,
      platform,
      createdBy: ctx.session.userID,
    };

    return this._create(body);
  }

  public async _create(body, sourceUUid?) {
    try {
      const result = await rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/create`,
        body: body,
      });

      if (result.retCode) {
        return {};
      }

      if (sourceUUid) {
        this.service.images.copyFile(result.response.uuid, sourceUUid);
      }
      return result.response;
    } catch (err) {
      return {};
    }
  }

  public async copy() {
    const { ctx } = this;
    const { uuid, name } = ctx.request.body;

    const [error, screen] = await errorCaptured(this.findById(uuid));

    const body = {
      ...screen,
      name,
      createdBy: ctx.session.userID,
    };
    const data = await this._create(body, uuid);
    await this.createMultiEndM(screen, uuid, data, name);
    return data;
  }

  public async createByTemplate() {
    const { ctx } = this;
    const { uuid, name, platform } = ctx.request.body;

    const [error, screen] = await errorCaptured(this.service.template.getById(uuid));
    console.info(screen);
    const body = {
      ...screen,
      name,
      platform,
      createdBy: ctx.session.userID,
    };
    const data = await this._create(body, uuid);
    await this.createMultiEndM(screen, uuid, data, name, platform);
    return data;
  }

  public async createMultiEndM(screen, uuid, data, name, platform?) {
    if (platform === 'MultiEnd' || (screen && screen.platform === 'MultiEnd')) {
      const mBody = {
        uuid: uuid,
        createdBy: this.ctx.session.userID,
      };

      const [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/findScreenM`,
          body: mBody,
        }),
      );
      if (error || !result.response) {
        return data;
      }
      const cBody = {
        uuid: data.uuid,
        config: screen.configM ? screen.configM : result.response.config,
        name: name,
        createdBy: this.ctx.session.userID,
      };
      await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/createM`,
          body: cBody,
        }),
      );
    }
  }

  public async createByConfig() {
    const { originUUid } = this.ctx.request.body;
    const file = this.ctx.request.files[0];
    const [error, screen] = await errorCaptured(this.findById(originUUid));

    console.log('file', file);
    const data = fs.readFileSync(file.filepath, 'utf-8');

    const { bgConfig, items } = JSON.parse(data);
    const originScreenConfig = JSON.parse(screen.config);
    const finallyConfig = {
      ...originScreenConfig,
      bgConfig: bgConfig.size,
      items: originScreenConfig.items.map(item => {
        const targetItem = items.find(v => v.id === item.id);

        return {
          ...item,
          style: {
            ...item.style,
            size: targetItem ? targetItem.style.size : item.style.size,
            pos: targetItem ? targetItem.style.pos : item.style.pos,
          },
        };
      }),
    };

    const body = {
      name: screen.name + new Date().getHours() + new Date().getMinutes(),
      config: JSON.stringify(finallyConfig),
      isDelete: 0,
      createdBy: 'mobile2020',
    };

    return this._create(body);
  }

  public async findById(id: string, shared = 0, signature = '') {
    const { ctx } = this;
    const body = {
      uuid: id,
      createdBy: ctx.session.userID,
      shared,
    };

    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/findScreen`,
        body: body,
      }),
    );
    if (error || !result.response) {
      ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
      return;
    }

    const code = result.response.encryptCode;
    result.response.passwordChange = 0;
    if (!signature) {
      // token链接访问时，没有输入密码，所以本次存储的密码没变 保持原来0值
      // 改密码后 或者第一次设置密码 ctx.session[`${result.response.uuid}-code`] 可能没值 先删除与的关系
      if (code !== ctx.session[`${result.response.uuid}-code`]) {
        result.response.passwordChange = 1;
      }
    }
    result.response.encryptCode = '';
    return result.response;
  }

  public async findByIdM(id: string, shared = 0) {
    const { ctx } = this;
    const body = {
      uuid: id,
      createdBy: ctx.session.userID,
      shared,
    };

    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/findScreenM`,
        body: body,
      }),
    );
    if (error || !result.response) {
      ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
      return;
    }

    result.response.encryptCode = '';
    return result.response;
  }

  public async update() {
    const { ctx } = this;
    const { uuid, name, config, thumb, eventConfig = '', isDelete } = ctx.request.body;
    const screen = await this.findById(uuid);

    if (!screen || !screen.uuid) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }

    const allow = await ValidatePermission(
      ResourceName.Screen,
      Operation.Update,
      screen,
      ctx,
      this.ctx.proxy.auth.CheckPermByRoles,
    );
    if (allow) {
      const body = {
        ...screen,
        uuid,
        name,
        eventConfig,
        config,
        isDelete,
        createdBy: ctx.session.userID,
        thumb: thumb || screen.thumb,
      };

      const [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/update`,
          body: body,
        }),
      );

      if (error || result.retCode) {
        ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
        return;
      }

      ctx.body = LogicError.FromError(this.config.errors.OK);
    } else {
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  public async findWithComp(id) {
    const [error, screen] = await errorCaptured(this.findById(id));

    const [cerror, components] = await errorCaptured(this.ctx.service.component.list());
    let configObj = {
      bgConfig: {},
      items: [],
    };
    try {
      configObj = JSON.parse(screen.config);
    } catch (err) {
      console.log('json.parse', err);
    }
    configObj.items = components;

    screen.config = JSON.stringify(configObj);
    return screen;
  }

  public async list() {
    const { ctx } = this;
    const { pageSize, pageNo, sortBy, orderBy, name, isRelease, isDelete } = ctx.request.body;

    const body = {
      pageNo,
      pageSize,
      sortBy,
      orderBy,
      name,
      isRelease,
      isDelete,
      createdBy: ctx.session.userID,
      role: ctx.session.userRole,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/list`,
        body: body,
      }),
    );
    if (error || !result || result.retCode) {
      ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
      return;
    }

    const { count, data } = result.response;
    ctx.body = LogicError.FromOK({
      data: data,
      count: count,
    });
  }

  public async updateName() {
    const { ctx } = this;
    const { uuid, name, platform } = ctx.request.body;
    const screen = await this.findById(uuid);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    const allow = await ValidatePermission(
      ResourceName.Screen,
      Operation.Update,
      screen,
      ctx,
      this.ctx.proxy.auth.CheckPermByRoles,
    );
    if (allow) {
      const body = {
        ...screen,
        uuid,
        name,
        createdBy: ctx.session.userID,
      };

      const [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/update`,
          body: body,
        }),
      );

      if (error || result.retCode) {
        ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
        return;
      }

      // 如果是双端的应用还需要重命名移动端的
      if (platform === 'MultiEnd') {
        const screenM = await this.findByIdM(uuid);
        if (screenM) {
          const body = {
            ...screenM,
            uuid,
            name,
            createdBy: ctx.session.userID,
          };

          await errorCaptured(
            rq({
              url: `${this.app.config.yaml.serviceDomain}/api/screen/updateM`,
              body: body,
            }),
          );
        }
      }
      ctx.body = LogicError.FromError(this.config.errors.OK);
    } else {
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  public async releaseCombined() {
    const { ctx } = this;
    const { combinationScreenId, isRelease, name, encrypt } = ctx.request.body;
    const screen = await this.findScreenCombined(combinationScreenId);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    const allow = await ValidatePermission(
      ResourceName.Screen,
      Operation.Publish,
      screen,
      ctx,
      this.ctx.proxy.auth.CheckPermByRoles,
    );
    if (allow) {
      const body = {
        combinationScreenId,
        isRelease: Number(isRelease),
        encryptInfo: encrypt,
        // encrypt: {
        //   type: 1, // int 加密方式 0 不加密 1 密码加密 2 token加密（预留）
        //   expiration: 5 * 60, // 有效期 秒 默认1天 即 24 * 60 * 60
        //   code: '124242', // 密码
        // },
      };
      const [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/combination/screen/release`,
          body: body,
        }),
      );

      if (error || result.retCode) {
        ctx.body = LogicError.FromError(this.config.errors.DB_ERROR);
        return;
      }

      ctx.body = LogicError.FromError(this.config.errors.OK);
    } else {
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  // 发布接口
  public async release() {
    const { ctx } = this;
    const { uuid, isRelease, name, encrypt, releaseVersion, Encrypt } = ctx.request.body;
    const screen = await this.findById(uuid);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    const allow = await ValidatePermission(
      ResourceName.Screen,
      Operation.Publish,
      screen,
      ctx,
      this.ctx.proxy.auth.CheckPermByRoles,
    );
    if (allow) {
      const body = {
        uuid,
        name,
        isRelease: Number(isRelease),
        releaseVersion,
        Encrypt,
        encrypt,
        // encrypt: {
        //   type: 1, // int 加密方式 0 不加密 1 密码加密 2 token加密（预留）
        //   expiration: 5 * 60, // 有效期 秒 默认1天 即 24 * 60 * 60
        //   code: '124242', // 密码
        // },
      };
      const [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/release`,
          body: body,
        }),
      );

      if (error || result.retCode) {
        ctx.body = LogicError.FromError(this.config.errors.DB_ERROR);
        return;
      }
      ctx.body = LogicError.FromOK({
        data: result.response,
      });

      // ctx.body = LogicError.FromError(this.config.errors.OK);
    } else {
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  public async verificationCombined() {
    const { ctx } = this;
    const { combinationScreenId, password } = ctx.request.body;
    const screen = await this.findScreenCombined(combinationScreenId);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    const allow = await ValidatePermission(
      ResourceName.Screen,
      Operation.Publish,
      screen,
      ctx,
      this.ctx.proxy.auth.CheckPermByRoles,
    );
    if (allow) {
      const body = {
        combinationScreenId: combinationScreenId, // 大屏的combinationScreenId
        code: password, // 用户输入的code
      };

      const [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/combination/screen/verification`,
          body: body,
        }),
      );

      if (error || result.retCode) {
        ctx.body = LogicError.FromError(this.config.errors.RELEASE_PASSWORD_ERROR);
        return;
      }
      ctx.session[`${combinationScreenId}-code`] = password;
      ctx.body = LogicError.FromOK(this.config.errors.OK);
    } else {
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  // 发布页面密码校验
  public async verification() {
    const { ctx } = this;
    const { uuid, password, viewTime = null, signature = '' } = ctx.request.body;
    const screen = await this.findById(uuid);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    // const allow = await ValidatePermission(
    //   ResourceName.Screen,
    //   Operation.Publish,
    //   screen,
    //   ctx,
    //   this.ctx.proxy.auth.CheckPermByRoles,
    // );
    const allow = true;
    if (allow) {
      const body = {
        uuid: uuid, // 大屏的uuid
        code: password, // 用户输入的code
        viewTime,
        signature,
      };

      const [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/verification`,
          body: body,
        }),
      );

      if (error || result.retCode) {
        ctx.body = LogicError.FromError(this.config.errors.RELEASE_PASSWORD_ERROR);
        return;
      }
      ctx.session[`${uuid}-code`] = password;
      ctx.body = LogicError.FromOK(this.config.errors.OK);
    } else {
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  public async delete(real = false) {
    const { ctx } = this;
    const { uuid } = ctx.request.body;
    const screen = await this.findById(uuid);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    const allow = await ValidatePermission(
      ResourceName.Screen,
      Operation.Delete,
      screen,
      ctx,
      this.ctx.proxy.auth.CheckPermByRoles,
    );
    if (allow) {
      const body = {
        ...screen,
        isDelete: real ? 2 : 1,
        createdBy: ctx.session.userID,
      };

      const [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/update`,
          body: body,
        }),
      );

      if (error || result.retCode) {
        ctx.body = LogicError.FromError({
          code: result.retCode,
          msg: result.retMsg,
          chmsg: result.retMsg,
        });
        return;
      }

      ctx.body = LogicError.FromError(this.config.errors.OK);
    } else {
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  public async updateScreenThumb() {
    const { ctx, service } = this;
    const { screenId, thumb } = ctx.request.body;
    let screen = await this.findById(screenId);
    if (!screen) {
      return (this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND));
    }
    const allow = await ValidatePermission(
      ResourceName.Screen,
      Operation.Update,
      screen,
      ctx,
      this.ctx.proxy.auth.CheckPermByRoles,
    );
    if (allow) {
      const originThumbName = screen.thumb;

      if (thumb !== originThumbName) {
        const body = {
          ...screen,
          thumb,
        };

        const [error, result] = await errorCaptured(
          rq({
            url: `${this.app.config.yaml.serviceDomain}/api/screen/update`,
            body: body,
          }),
        );

        if (error || result.retCode) {
          ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
          return;
        }
      }
      ctx.body = LogicError.FromOK(screen);
    } else {
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  public async queryDynamicDataById() {
    const { ctx } = this;
    const { id } = ctx.request.body;

    const body = {
      screenId: Number(id),
      createdBy: ctx.session.userID,
    };

    try {
      const result = await rq({
        url: `${this.app.config.yaml.serviceDomain}/api/component/list`,
        body: body,
      });

      const { data } = result.response;

      let mappingData = [];

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          const mapData = await rq({
            url: `${this.app.config.yaml.serviceDomain}/api/mapping/get_data`,
            body: {
              componentId: Number(data[i].cid),
              createdBy: ctx.session.userID,
            },
          });

          let mapping = [];
          if (!!mapData.mappingData && mapData.mappingData.length > 0) {
            mapping = mapData.mappingData.map(v => JSON.parse(v));
          }

          if (mapping.length > 0) {
            mappingData.push({
              id: data[i].cid,
              data: JSON.stringify(mapping),
            });
          }
        }
      }
      ctx.body = LogicError.FromOK({
        data: mappingData,
      });
    } catch (error) {
      console.log('error', error);
      ctx.body = LogicError.FromError(this.config.errors.PERMISSION_ERROR);
    }
  }

  public async generatorZip() {
    const { uuid, name } = this.ctx.query;
    const screen = await this.service.screen.findById(uuid);
    try {
      let configObj = {};
      try {
        configObj = JSON.parse(screen.config);
      } catch (e) {
        console.error(e);
      }

      const items = configObj['items'];
      const compType = Array.from(new Set(items.map(({ type }) => type)));

      const zip = createCompZip(compType);

      zip.file('client/data.json', screen.config);
      zip.file('client/package.json');
      zip.file('index.ts');

      const blob = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      this.ctx.attachment(`${decodeURIComponent(name)}源码.zip`);
      this.ctx.set('Content-Type', 'application/octet-stream');
      this.ctx.body = blob;
    } catch (e) {
      console.error(e);
    }
  }

  public async adaptScreen() {
    const { ctx } = this;
    const { uuid, col_split_priority, thumb_img } = ctx.request.body;
    const [_error, screen] = await errorCaptured(this.findById(uuid));

    const [_cError, resp] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.adaptHost}/layout`,
        header: {
          'Content-Type': 'multipart/form-data',
        },
        formData: {
          layout: screen.config,
          screen_width: 750,
          col_split_priority,
          // thumb_img
        },
        removeJSON: true,
      }),
    );
    console.log('_cError', _cError);
    console.log(resp);
    const realResp = JSON.parse(resp);

    if (_cError || !realResp || realResp.layout?.length === 0) {
      ctx.body = LogicError.FromError(this.config.errors.ADAPT_ERROR);
      return;
    }

    try {
      const results = realResp.layout;
      const errCodes = [];
      const data = [];
      results.map(result => {
        if (result) {
          errCodes.concat(result.err_codes || []);
          result.res && data.push(result.res);
        }
      });
      const originData = JSON.parse(screen.config);

      const mConfigs = data.map(i => {
        return JSON.stringify({
          ...originData,
          bgConfig: {
            ...originData.bgConfig,
            size: i.bgConfig.size,
          },
          items: originData.items.map(item => {
            const findItem = i.items.find(v => v.id === item.id);

            return findItem
              ? {
                  ...item,
                  style: {
                    ...item.style,
                    size: findItem.style.size,
                    pos: findItem.style.pos,
                  },
                }
              : item;
          }),
        });
      });

      ctx.body = LogicError.FromOK({ mConfigs, errCodes });
    } catch (e) {
      ctx.body = LogicError.FromError(this.config.errors.ADAPT_ERROR);
    }
  }

  public async openMobile() {
    const { uuid, name, config } = this.ctx.request.body;
    const body = {
      uuid,
      name,
      createdBy: this.ctx.session.userID,
    };

    const [_error, screen] = await errorCaptured(this.findById(uuid));

    // 第一次开启
    if (screen.platform !== 'MultiEnd') {
      const [error, _result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/openM`,
          body: body,
        }),
      );
      if (error) {
        this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
        return;
      }

      const cBody = {
        uuid: uuid,
        config: config,
        name: screen.name || name,
        createdBy: this.ctx.session.userID,
      };

      const [cError, cResult] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/screen/createM`,
          body: cBody,
        }),
      );

      if (cError) {
        this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
        return;
      }

      this.ctx.body = LogicError.FromOK({ cResult });
      return;
    }
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/updateM`,
        body: {
          uuid,
          config,
          createdBy: this.ctx.session.userID,
        },
      }),
    );

    if (error) {
      this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
      return;
    }
    this.ctx.body = LogicError.FromOK({ result });
  }

  public async updateM() {
    const { uuid, name, config } = this.ctx.request.body;
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/updateM`,
        body: {
          uuid,
          name,
          config,
          createdBy: this.ctx.session.userID,
        },
      }),
    );

    if (error) {
      this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_NOT_FOUND);
      return;
    }
    this.ctx.body = LogicError.FromOK({ result });
  }

  private async getLock(uuid, uid, res, tUUID) {
    if (!res) {
      await this.app.redis.set(uuid, tUUID, 'EX', 5 * 60, 'NX');
      this.ctx.logger.info('operateScreenLock', '抢lock成功', uuid, uid, tUUID);
      this.ctx.body = LogicError.FromOK({ lock: `${uuid}-${tUUID}` });
    } else {
      this.ctx.logger.info('operateScreenLock', 'lock已经被抢，抢lock失败', uuid, uid);
      this.ctx.body = LogicError.FromOK({ lock: '' });
    }
  }

  private async releaseLock(uuid, uid, res, tUUID) {
    if (!!res) {
      const temp = await this.app.redis.get(uuid);
      if (temp === tUUID) {
        await this.app.redis.del(uuid);
        this.ctx.logger.info('operateScreenLock', '释放lock成功', uuid, uid);
        this.ctx.body = LogicError.FromOK({ unlock: uuid });
      } else {
        this.ctx.logger.info('operateScreenLock', 'tUUID异常释放lock失败', uuid, uid);
        this.ctx.body = LogicError.FromOK({ unlock: '' });
      }
    } else {
      this.ctx.logger.info('operateScreenLock', 'lock已经被释放了', uuid, uid);
      this.ctx.body = LogicError.FromOK({ unlock: '' });
    }
  }

  private async heartbeat(uuid, uid, res, tUUID) {
    if (!res) {
      const temp = await this.app.redis.get(uuid);
      if (temp === tUUID) {
        await this.app.redis.set(uuid, tUUID, 'EX', 5 * 60, 'XX');
        this.ctx.logger.info('operateScreenLock', '收到心跳成功', uuid, uid);
        this.ctx.body = LogicError.FromOK({ hb: tUUID });
      } else {
        this.ctx.logger.info('operateScreenLock', res, 'tUUID异常，心跳更新失败');
        this.ctx.body = LogicError.FromOK({ hb: '' });
      }
    } else {
      this.ctx.logger.info('operateScreenLock', res, '没有发现lock，心跳更新失败');
      this.ctx.body = LogicError.FromOK({ hb: '' });
    }
  }

  public async operateScreenLock(mode: 'get' | 'release' | 'heartbeat') {
    const { uuid, tUUID } = this.ctx.request.body;
    const uid = this.ctx.session.userID;
    this.ctx.logger.info('operateScreenLock', 'mode', mode);
    try {
      if (uuid && tUUID) {
        const res = await this.app.redis.get(uuid);
        this.ctx.logger.info('operateScreenLock', 'res', res);

        if (mode === 'get') {
          await this.getLock(uuid, uid, res, tUUID);
        } else if (mode === 'release') {
          await this.releaseLock(uuid, uid, res, tUUID);
        } else if (mode === 'heartbeat') {
          await this.heartbeat(uuid, uid, res, tUUID);
        }
      } else {
        this.ctx.logger.info('operateScreenLock', mode, 'uuid异常，操作lock失败', uuid);
        this.ctx.body = LogicError.FromOK({ lock: '' });
      }
    } catch (e) {
      this.ctx.logger.error(e);
      this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_LOCK_ERROR);
    }
  }

  public async getScreenVersionList() {
    const body = Object.assign({}, this.ctx.request.body, { operator: this.ctx.session.userID });
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/version/list`,
        body: { ...body, versionId: parseInt(body.versionId, 10) },
      }),
    );
    console.info(error, result);
    if (error || !!result.retCode || !result.response) {
      this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_VERSION_ERROR);
      return;
    }
    this.ctx.body = LogicError.FromOK(result.response);
  }

  public async getScreenConfigByVersionId() {
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/version/id`,
        body: { ...this.ctx.request.body },
      }),
    );
    console.info(error, result);
    if (error || !!result.retCode || !result.response) {
      this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_VERSION_ERROR);
      return;
    }
    this.ctx.body = LogicError.FromOK(result.response);
  }

  //查询snapshot列表
  public async getSnapshotList(id: string, versionId?: string) {
    const { ctx } = this;
    const body = {
      operator: this.ctx.session.userID,
      screenId: id,
      versionId: versionId,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/snapshot/list`,
        body: body,
      }),
    );
    if (error || !result.data) {
      ctx.body = LogicError.FromError(this.config.errors.SNAPSHORT_NOT_FOUND);
      return;
    }
    this.ctx.body = LogicError.FromOK(result.data);
  }
  //snapshot-创建
  public async createSnapshot(id: string) {
    const { ctx } = this;
    const body = {
      operator: this.ctx.session.userID,
      screenId: id,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/snapshot/create`,
        body: body,
      }),
    );
    if (error || result.retCode !== 0) {
      ctx.body = LogicError.FromError(this.config.errors.SNAPSHORT_NOT_FOUND);
      return;
    }
    this.ctx.body = LogicError.FromOK(result);
  }
  // snapshot-更新
  public async updateSnapshot(versionId: string, remark: string) {
    const { ctx } = this;
    const body = {
      operator: this.ctx.session.userID,
      versionId, // snapshotID，必填
      remark,
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/snapshot/update`,
        body: body,
      }),
    );
    if (error || result.retCode !== 0) {
      ctx.body = LogicError.FromError(this.config.errors.SNAPSHORT_NOT_FOUND);
      return;
    }
    this.ctx.body = LogicError.FromOK(result);
  }
  // snapshot-删除
  public async deleteSnapshot(versionId: string) {
    const { ctx } = this;
    const body = {
      operator: this.ctx.session.userID,
      versionId, // snapshotID，必填
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/snapshot/delete`,
        body: body,
      }),
    );
    if (error || result.retCode !== 0) {
      ctx.body = LogicError.FromError(this.config.errors.SNAPSHORT_NOT_FOUND);
      return;
    }
    this.ctx.body = LogicError.FromOK(result);
  }
  // 发布时预览对应的快照
  public async previewSnapshot(uuid: string, versionId: string) {
    const body = {
      uuid,
      versionId, // snapshotID，必填
    };
    const [error, result] = await errorCaptured(
      rq({
        url: `${this.app.config.yaml.serviceDomain}/api/screen/snapshot/findScreen`,
        body: body,
      }),
    );
    console.info(error, result);
    if (error || !!result.retCode || !result.response) {
      this.ctx.body = LogicError.FromError(this.config.errors.SCREEN_VERSION_ERROR);
      return;
    }
    this.ctx.body = LogicError.FromOK(result.response);
  }

  // 导出大屏文件
  public async generatorScreenConfigZipFile() {
    const { uuid, name, networkType, publicPath: pb } = this.ctx.query;

    try {
      const screen = await this.service.screen.findById(uuid);
      const operator = this.ctx.session.userID;
      if (!screen || operator !== screen.CreatedBy) {
        this.ctx.body = LogicError.FromError(this.config.errors.GEN_SCREEN_CONFIG_ERROR);
        return;
      }

      let body = {
        userId: operator,
        keyWord: '',
        timeSortType: 'name_asc',
        pageNo: 1,
        pageSize: 99999,
      };
      let [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/data_source/get`,
          body: body,
        }),
      );
      if (error || !result || result.retCode !== 0) {
        this.ctx.body = LogicError.FromError(this.config.errors.GEN_SCREEN_CONFIG_ERROR);
        return;
      }

      const state = {
        appId: this.app.config.yaml.appId,
        basename: this.app.config.basePath,
        bucketName: this.app.config.yaml.cosBucketName,
        networkType,
      };

      const zip = new JsZip();

      const sources = result.sources;
      if (Array.isArray(sources)) {
        const temps = sources.filter(item => {
          const screen = item.screen;
          if (!screen) {
            return false;
          }
          return screen.find(v => {
            return v.uuid && v.uuid === uuid;
          });
        });
        const screenDataSource = {};
        temps.map(v => {
          delete v.screen;
          screenDataSource[v.sourceId] = { ...v };
        });
        state['screenDataSource'] = { ...screenDataSource };
      }

      body = {
        customFunIds: '',
        screenId: uuid,
        userId: operator,
      } as any;
      [error, result] = await errorCaptured(
        rq({
          url: `${this.app.config.yaml.serviceDomain}/api/customfun/get_all`,
          body: body,
        }),
      );
      if (error || !result || result.retCode !== 0) {
        this.ctx.body = LogicError.FromError(this.config.errors.GEN_SCREEN_CONFIG_ERROR);
        return;
      }

      state['functionConfig'] = { data: [...(result.customFuns || [])] };

      const filePath = `app/public/screenPlay.html`;
      const rs = fs.readFileSync(path.resolve(this.app.baseDir, filePath), 'utf-8');
      let realResult = shouldChangeBodyStyle(this.ctx.path) ? changeBodyStyle(rs, this.ctx.query) : rs;

      if (networkType === 'intranet') {
        const path = decodeURIComponent(pb);
        delete state.bucketName;
        // 解析该大屏用到哪些存放到cos上的资源文件，并将静态资源文件从cos下载写入zip
        const config = screen.config || '';
        // 16位纯数字的
        let matchs = config.match(/[0-9]{16}\.png|gif|jpg|jpeg|svg|mp4|mpeg|wmv|flv|zip|glb|hdr|exr/g);
        matchs = matchs || [];
        // 32位uuid的
        let temps = config.match(/[0-9a-f]{32}\.png|gif|jpg|jpeg|svg|mp4|mpeg|wmv|flv|zip|glb|hdr|exr/g);
        temps = temps || [];
        const realResources = Array.from(new Set([...matchs, ...temps]));
        if (realResources.length > 0) {
          for (let i = 0; i < realResources.length; i++) {
            try {
              const res = await this.service.images.getFile(realResources[i]);
              if (!res['error'] && res['Body']) {
                zip.file(`yunmu/static/media/${realResources[i]}`, toArrayBuffer(res['Body']), { binary: true });
              }
            } catch (e) {
              console.error(e);
            }
          }
        }

        state['publicPath'] = decodeURIComponent(path);
        realResult = realResult.replace(
          new RegExp('https://cloud-screen-static-1254257443.file.myqcloud.com/', 'g'),
          path,
        );
      }
      state['screenConfig'] = { ...screen };

      const instructions = getInstructions(uuid, state['publicPath'] || '');
      zip.file(`yunmu/使用说明.txt`, instructions);

      const exportHTML = parseIndexHtml(realResult);
      const html = `${exportHTML.head.replace('{cspNonce}', this.ctx.cspNonce)}
            <script>window.PRE_FETCH_STATE=${JSON.stringify(state)}</script>
            ${exportHTML.tail}`;
      const time = new Date().getTime();
      const realFilePath = `app/public/screenPlay_${uuid}_${time}.html`;
      fs.writeFileSync(realFilePath, html, { encoding: 'utf-8' });
      const publicPath = path.resolve(__dirname, '../public');
      readDirAndZip(zip.folder('yunmu'), publicPath, time, uuid);
      fs.unlinkSync(realFilePath);

      const blob = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      this.ctx.attachment(`${decodeURIComponent(name)}配置.zip`);
      this.ctx.set('Content-Type', 'application/octet-stream');
      this.ctx.body = blob;
    } catch (e) {
      console.error(e);
      this.ctx.body = LogicError.FromError(this.config.errors.GEN_SCREEN_CONFIG_ERROR);
      return;
    }
  }
}
