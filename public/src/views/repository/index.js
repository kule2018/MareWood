import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import RestoreFromTrash from '@material-ui/icons/RestoreFromTrash';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen'
import Computer from '@material-ui/icons/Computer';
import Announcement from '@material-ui/icons/Announcement';
import LinkIcon from '@material-ui/icons/Link'
import {
    Dialog, DialogContent, DialogTitle, DialogContentText, Tooltip,
    DialogActions, Button, IconButton, Fab, Paper, TableRow, TableHead, TableCell, TableBody, Table
} from '@material-ui/core';
import RepositoryStatus from './repositoryStatus'
import RepositoryJobStatus from './repositoryJobStatus'
import Edit from './edit'
import HelperTooltips from "../../components/helperTooltips"
import {repositories, destroy,deleteDepend} from '../../api/repository'
import Snackbar from '../../components/snackbar/index'
import { getSystemInfo } from "../../utils/dataStorage"

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing(1),
        overflowX: 'auto',
    },
    table: {
        minWidth: 650,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
});


class RepositoryTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tableData: [],
            destroyDialogShow: false,
            editShow: false,
            dependentSupport: getSystemInfo("DependTools")
        };
        this.destroyId = 0; //记录当前要删除的id
        this.timeout = null;
    }

    componentDidMount() {
        this.getTableData()
    }
    componentWillUnmount() {
        if(this.timeout)clearTimeout(this.timeout);
    }
    getTableData() {
        if(this.timeout)clearTimeout(this.timeout);

        repositories().then(r => {
            this.setState({tableData: r});

            for (let i = 0; i < r.length; i++) {
                if (r[i].Status === 0 || (r[i].JobStatus === 1 && r[i].Status === 1 )) {
                    //仓库正在克隆当中  或者 （一个正常的仓库很繁忙）的情况就会刷新
                    this.timeout = setTimeout(()=>{
                        this.getTableData()
                    },5000);
                    return
                }
            }

        }).catch(() => {})
    }

    destroyDialogOpen(id) {
        this.destroyId = id;
        this.setState({destroyDialogShow: true})
    }

    destroyDialogClose() {
        this.setState({destroyDialogShow: false})
    }
    deleteRepositoryDepend(row){
        if(row.Status !== 1){
            Snackbar.warning("仓库状态不正常，无法删除依赖");
            return
        }
        deleteDepend({id:row.ID}).then(r=>{
            Snackbar.success(r);
            // this.getTableData()
        }).catch(()=>{})
    }
    destroyConfirm() {
        destroy({id: this.destroyId}).then(r => {
            this.setState({destroyDialogShow: false});
            this.getTableData()
        }).catch(() => {
        })
    }

    editDialogShow() {
        this.setState({editShow: true})
    }

    editDialogClose() {
        this.setState({editShow: false})
    }

    createSuccess() {
        this.setState({editShow: false});
        this.getTableData()
    }

    render() {
        const {classes} = this.props;
        return (
            <div>
                <Paper className={classes.root}>
                    <Table className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell align="center">仓库名字</TableCell>
                                <TableCell align="center">克隆状态</TableCell>
                                <TableCell align="center">
                                    工作状态
                                    <HelperTooltips help="当前工作目录正在执行其他部署任务，资源被占用" />
                                </TableCell>
                                <TableCell align="center">仓库权限</TableCell>
                                <TableCell align="center">终端信息</TableCell>
                                <TableCell align="center">备注</TableCell>
                                <TableCell align="center">仓库地址</TableCell>
                                <TableCell align="center">依赖工具</TableCell>
                                <TableCell align="center">操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.tableData.map(row => (
                                <TableRow key={row.ID}>
                                    <TableCell component="th" scope="row">
                                        {row.ID}
                                    </TableCell>
                                    <TableCell align="center">{row.Name}</TableCell>
                                    <TableCell align="center">
                                        <RepositoryStatus status={row.Status}/>
                                    </TableCell>
                                    <TableCell align="center">
                                        <RepositoryJobStatus status={row.JobStatus} />
                                    </TableCell>
                                    <TableCell align="center">
                                        {
                                            row.UserName && row.Password ? (
                                                <Tooltip title={
                                                    <div>
                                                        用户名：{row.UserName}
                                                        <br/>
                                                        密码：{row.Password}
                                                    </div>
                                                } interactive>
                                                    <IconButton color="primary">
                                                        <LockIcon/>
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="仓库非私密" interactive>
                                                    <IconButton color="primary">
                                                        <LockOpenIcon/>
                                                    </IconButton>
                                                </Tooltip>
                                            )
                                        }
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title={
                                            <div style={{whiteSpace: "pre-wrap"}}>
                                                {row.TerminalInfo}
                                            </div>
                                        } interactive>
                                            <IconButton color="primary">
                                                <Computer/>
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Tooltip title={row.Desc} interactive>
                                            <IconButton color="primary">
                                                <Announcement/>
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title={row.Url} interactive>
                                            <IconButton color="primary">
                                                <LinkIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className="tag">{(row.DependTools).toUpperCase()}</span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="删除仓库" interactive>
                                            <IconButton color="primary"
                                                        onClick={this.destroyDialogOpen.bind(this, row.ID)}>
                                                <DeleteIcon/>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="删除依赖" interactive>
                                            <IconButton color="primary" onClick={this.deleteRepositoryDepend.bind(this,row)}>
                                                <RestoreFromTrash/>
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
                <Dialog
                    open={this.state.destroyDialogShow}
                    onClose={this.destroyDialogClose.bind(this)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"确认删除仓库?"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            你确认要删除这个仓库？没有任务使用此仓库才能删除。
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.destroyDialogClose.bind(this)} color="primary">
                            关闭
                        </Button>
                        <Button onClick={this.destroyConfirm.bind(this)} color="secondary" autoFocus>
                            确认
                        </Button>
                    </DialogActions>
                </Dialog>
                <Fab color="primary" className={classes.fab} aria-label="add" onClick={this.editDialogShow.bind(this)}>
                    <AddIcon/>
                </Fab>
                <Edit
                    dependentSupport={this.state.dependentSupport}
                    show={this.state.editShow}
                    handleClose={this.editDialogClose.bind(this)}
                    createSuccess={this.createSuccess.bind(this)}
                />
            </div>
        );
    }

}


export default withStyles(styles)(RepositoryTable)
