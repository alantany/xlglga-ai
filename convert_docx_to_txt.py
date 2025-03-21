#!/usr/bin/env python3
# coding: utf-8

"""
文档转换脚本：将docx和wps文件转换为txt文件
作者：AI辅助系统
"""

import os
import sys
import glob
import subprocess
from pathlib import Path

# 定义所有阶段目录
STAGE_DIRS = [
    "data/scenarios/1、立案前材料",
    "data/scenarios/2、刑拘前材料",
    "data/scenarios/3、报捕前材料",
    "data/scenarios/4、起诉前材料"
]

def check_pandoc():
    """检查是否安装了pandoc"""
    try:
        subprocess.run(["pandoc", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except:
        return False

def check_python_docx():
    """检查是否安装了python-docx库"""
    try:
        import docx
        return True
    except ImportError:
        return False

def convert_docx_with_pandoc(input_file, output_file):
    """使用pandoc转换docx文件为txt文件"""
    try:
        subprocess.run(["pandoc", input_file, "-o", output_file], 
                      check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError:
        print(f"警告：使用pandoc转换失败：{input_file}")
        return False

def convert_docx_with_python(input_file, output_file):
    """使用python-docx库转换docx文件为txt文件"""
    try:
        import docx
        doc = docx.Document(input_file)
        with open(output_file, "w", encoding="utf-8") as f:
            for para in doc.paragraphs:
                f.write(para.text + "\n")
        return True
    except Exception as e:
        print(f"警告：使用python-docx转换失败：{input_file}，错误：{e}")
        return False

def main():
    """主函数"""
    print("====== 开始转换文档 ======")
    
    # 检查工具
    has_pandoc = check_pandoc()
    has_python_docx = check_python_docx()
    
    if not has_pandoc and not has_python_docx:
        print("错误：未安装pandoc和python-docx库！")
        print("请安装以下工具之一：")
        print("1. pandoc: https://pandoc.org/installing.html")
        print("2. python-docx: pip install python-docx")
        return
    
    if has_pandoc:
        print("使用pandoc进行转换")
    else:
        print("使用python-docx进行转换")
    
    # 处理所有目录
    converted_count = 0
    skipped_count = 0
    failed_count = 0
    
    for dir_path in STAGE_DIRS:
        print(f"处理目录: {dir_path}")
        
        # 确保目录存在
        if not os.path.isdir(dir_path):
            print(f"警告：目录不存在: {dir_path}")
            continue
        
        # 获取目录中的所有docx和wps文件
        docx_files = glob.glob(os.path.join(dir_path, "*.docx"))
        wps_files = glob.glob(os.path.join(dir_path, "*.wps"))
        all_files = docx_files + wps_files
        
        for file_path in all_files:
            # 生成输出文件路径
            output_path = os.path.splitext(file_path)[0] + ".txt"
            
            # 跳过已经存在的txt文件
            if os.path.exists(output_path):
                print(f"已存在，跳过: {output_path}")
                skipped_count += 1
                continue
            
            print(f"转换: {file_path} -> {output_path}")
            
            success = False
            if has_pandoc:
                success = convert_docx_with_pandoc(file_path, output_path)
            
            if not success and has_python_docx and file_path.endswith(".docx"):
                success = convert_docx_with_python(file_path, output_path)
            
            if success:
                converted_count += 1
            else:
                failed_count += 1
                print(f"错误：无法转换文件: {file_path}")
    
    print("====== 文档转换完成 ======")
    print(f"转换成功: {converted_count} 文件")
    print(f"已跳过: {skipped_count} 文件")
    print(f"转换失败: {failed_count} 文件")

if __name__ == "__main__":
    main() 